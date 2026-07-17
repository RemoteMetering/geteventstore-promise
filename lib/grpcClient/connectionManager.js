import { KurrentDBClient } from '@kurrent/kurrentdb-client';

// The KurrentDB gRPC client multiplexes concurrent calls and subscriptions over
// a single HTTP/2 channel, so one shared client per config replaces connection
// pooling. The map stores the client promise so parallel first calls share one client.
const _connections = new Map();

export const buildConnectionString = (config, connectionName) => {
  const seedsString = config.gossipSeeds
    ? `${config.auth}@${config.gossipSeeds.map((seed) => `${seed.hostname}:${seed.port}`).join(',')}`
    : `${config.auth}@${config.host}:${config.port}`;
  const tuningParams = [
    config.maxDiscoverAttempts != null && `maxDiscoverAttempts=${config.maxDiscoverAttempts}`,
    config.gossipTimeout != null && `gossipTimeout=${config.gossipTimeout}`,
    config.discoveryInterval != null && `discoveryInterval=${config.discoveryInterval}`,
    config.keepAliveInterval != null && `keepAliveInterval=${config.keepAliveInterval}`,
    config.keepAliveTimeout != null && `keepAliveTimeout=${config.keepAliveTimeout}`,
    config.defaultDeadline != null && `defaultDeadline=${config.defaultDeadline}`,
    config.nodePreference != null && `nodePreference=${config.nodePreference}`,
    config.throwOnAppendFailure != null && `throwOnAppendFailure=${config.throwOnAppendFailure}`,
    config.tlsVerifyCert != null && `tlsVerifyCert=${config.tlsVerifyCert}`,
    // Mutual TLS key material. These are file paths, not the keys themselves, but treat the
    // resulting connection string as sensitive and never log it.
    config.userCertFile != null && `userCertFile=${config.userCertFile}`,
    config.userKeyFile != null && `userKeyFile=${config.userKeyFile}`
  ]
    .filter(Boolean)
    .map((param) => `&${param}`)
    .join('');
  return `${config.protocol}://${seedsString}?tls=${config.useSslConnection}${config.tlsCAFile ? `&tlsCAFile=${config.tlsCAFile}` : ''}${connectionName ? `&connectionName=${connectionName}` : ''}${tuningParams}`;
};

const createClient = async (config) => {
  const connectionName =
    (config.connectionNameGenerator && (await config.connectionNameGenerator())) || config.connectionName;
  return KurrentDBClient.connectionString(buildConnectionString(config, connectionName));
};

export default {
  // purposefully not a promise, to ensure no parallel race conditions
  getOrCreate(config) {
    let clientPromise = _connections.get(config);
    if (!clientPromise) {
      clientPromise = createClient(config);
      _connections.set(config, clientPromise);
    }
    return clientPromise;
  },
  close(config) {
    return async () => {
      const clientPromise = _connections.get(config);
      if (!clientPromise) return;
      _connections.delete(config);
      const client = await clientPromise;
      await client.dispose();
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
    const clients = await Promise.all([..._connections.values()]);
    _connections.clear();
    await Promise.all(clients.map((client) => client.dispose()));
  }
};
