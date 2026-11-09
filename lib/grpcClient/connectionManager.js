import { KurrentDBClient } from '@kurrent/kurrentdb-client';

// The KurrentDB gRPC client multiplexes concurrent calls and subscriptions over
// a single HTTP/2 channel, so one shared client per config replaces connection
// pooling. The map stores the client promise so parallel first calls share one client.
const _connections = new Map();
// Clients evicted after a bridge read failed, kept only while they still own open streams so
// close() can still dispose subscriptions that were opened on them.
const _retired = new Map();

// The SDK routes readStream and readAll (and getStreamMetadata, which calls readStream) through its
// Rust bridge. The bridge keeps its own connection and does not rediscover when the node it reached
// goes down, so after a leader failure every read keeps failing with UnavailableError while writes
// and subscriptions, which take the JS gRPC path, reconnect on their own. Wrapping these methods lets
// an unavailable read evict the cached client, so the next call builds a fresh one and rediscovers.
const BRIDGE_READS = ['readStream', 'readAll'];

// Optional connection-string tuning options, appended in this order when set.
// userCertFile and userKeyFile are mutual TLS file paths, not the keys themselves, but treat the
// resulting connection string as sensitive and never log it.
const TUNING_KEYS = [
  'maxDiscoverAttempts',
  'gossipTimeout',
  'discoveryInterval',
  'keepAliveInterval',
  'keepAliveTimeout',
  'defaultDeadline',
  'nodePreference',
  'throwOnAppendFailure',
  'tlsVerifyCert',
  'userCertFile',
  'userKeyFile'
];

const encodeAuth = ({ username, password }) => `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;

// The KurrentDB parser runs decodeURIComponent over these values, and a raw '&', '?' or '%' in one
// would end the value early, so they are encoded on the way in.
const ENCODED_KEYS = new Set(['userCertFile', 'userKeyFile']);
const encodeParam = (key, value) => (ENCODED_KEYS.has(key) ? encodeURIComponent(value) : value);

export const buildConnectionString = (config, connectionName) => {
  const auth = encodeAuth(config.credentials);
  const seedsString = config.gossipSeeds
    ? `${auth}@${config.gossipSeeds.map((seed) => `${seed.hostname}:${seed.port}`).join(',')}`
    : `${auth}@${config.host}:${config.port}`;
  const tuningParams = TUNING_KEYS.filter((key) => config[key] != null)
    .map((key) => `&${key}=${encodeParam(key, config[key])}`)
    .join('');
  return `${config.protocol}://${seedsString}?tls=${config.useSslConnection === true}${config.tlsCAFile ? `&tlsCAFile=${encodeURIComponent(config.tlsCAFile)}` : ''}${connectionName ? `&connectionName=${encodeURIComponent(connectionName)}` : ''}${tuningParams}`;
};

const createClient = async (config) => {
  const connectionName =
    (config.connectionNameGenerator && (await config.connectionNameGenerator())) || config.connectionName;
  return KurrentDBClient.connectionString(buildConnectionString(config, connectionName));
};

const retire = (config, client) => {
  // Nothing left to dispose, so drop the reference and let the client be collected.
  if (client.disposableStreams.size === 0) return;
  if (!_retired.has(config)) _retired.set(config, new Set());
  _retired.get(config).add(client);
};

const disposeRetired = async (config) => {
  const clients = _retired.get(config);
  if (!clients) return;
  _retired.delete(config);
  await Promise.all([...clients].map((client) => client.dispose()));
};

const wrapBridgeReads = (client, evict) => {
  for (const method of BRIDGE_READS) {
    const proto = Object.getPrototypeOf(client);
    client[method] = async function* (...args) {
      try {
        // Resolved per call so the prototype method stays the single source of behaviour.
        yield* proto[method].apply(client, args);
      } catch (err) {
        if (err && err.type === 'unavailable') evict(client);
        throw err;
      }
    };
  }
  return client;
};

export default {
  // purposefully not a promise, to ensure no parallel race conditions
  getOrCreate(config) {
    let clientPromise = _connections.get(config);
    if (!clientPromise) {
      clientPromise = createClient(config).then((client) =>
        wrapBridgeReads(client, (failedClient) => {
          // Only evict if no other call has already replaced this client.
          if (_connections.get(config) !== clientPromise) return;
          _connections.delete(config);
          retire(config, failedClient);
        })
      );
      _connections.set(config, clientPromise);
      clientPromise.catch(() => {
        if (_connections.get(config) === clientPromise) _connections.delete(config);
      });
    }
    return clientPromise;
  },
  close(config) {
    return async () => {
      await disposeRetired(config);
      const clientPromise = _connections.get(config);
      if (!clientPromise) return;
      _connections.delete(config);
      // A client that never connected has nothing to dispose.
      const client = await clientPromise.catch(() => null);
      if (client) await client.dispose();
    };
  },
  getConnection(config) {
    return async () => {
      const clientPromise = _connections.get(config);
      if (!clientPromise) throw new Error(`Connection not found`);
      return clientPromise;
    };
  },
  async closeAllConnections() {
    const clientPromises = [..._connections.values()];
    _connections.clear();
    await Promise.all([..._retired.keys()].map(disposeRetired));
    const results = await Promise.allSettled(clientPromises);
    await Promise.all(
      results.filter((result) => result.status === 'fulfilled').map((result) => result.value.dispose())
    );
  }
};
