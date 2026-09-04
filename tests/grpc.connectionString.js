import assert from 'assert';
import { parseConnectionString } from '@kurrent/kurrentdb-client/dist/Client/parseConnectionString.js';
import { buildConnectionString } from '../lib/grpcClient/connectionManager.js';

// Mirrors the internal _config shape the GRPCClient constructor produces.
const baseConfig = () => ({
  protocol: 'kurrentdb+discover',
  host: 'localhost',
  port: 22117,
  credentials: { username: 'admin', password: 'changeit' },
  useSslConnection: false
});

// Pulls the query params off a built connection string into a plain map.
const paramsOf = (connectionString) => {
  const query = connectionString.slice(connectionString.indexOf('?') + 1);
  return Object.fromEntries(query.split('&').map((pair) => pair.split('=')));
};

describe('gRPC Client - Connection String Builder', () => {
  it('Should build a single node base string with only tls when no tuning params are set', () => {
    const connectionString = buildConnectionString(baseConfig());
    assert.strictEqual(connectionString, 'kurrentdb+discover://admin:changeit@localhost:22117?tls=false');
  });

  it('Should build a gossip seeds string from the seed list', () => {
    const config = baseConfig();
    delete config.host;
    delete config.port;
    config.gossipSeeds = [
      { hostname: 'node1', port: 1111 },
      { hostname: 'node2', port: 2222 },
      { hostname: 'node3', port: 3333 }
    ];
    const connectionString = buildConnectionString(config);
    assert.strictEqual(
      connectionString,
      'kurrentdb+discover://admin:changeit@node1:1111,node2:2222,node3:3333?tls=false'
    );
  });

  it('Should include the connection name when provided', () => {
    const connectionString = buildConnectionString(baseConfig(), 'MY_CONNECTION');
    assert.strictEqual(paramsOf(connectionString).connectionName, 'MY_CONNECTION');
  });

  it('Should pass through the previously supported discovery params', () => {
    const config = baseConfig();
    config.maxDiscoverAttempts = 5;
    config.gossipTimeout = 3000;
    config.discoveryInterval = 500;
    const params = paramsOf(buildConnectionString(config));
    assert.strictEqual(params.maxDiscoverAttempts, '5');
    assert.strictEqual(params.gossipTimeout, '3000');
    assert.strictEqual(params.discoveryInterval, '500');
  });

  it('Should pass through the keep alive params', () => {
    const config = baseConfig();
    config.keepAliveInterval = 12000;
    config.keepAliveTimeout = 8000;
    const params = paramsOf(buildConnectionString(config));
    assert.strictEqual(params.keepAliveInterval, '12000');
    assert.strictEqual(params.keepAliveTimeout, '8000');
  });

  it('Should pass through defaultDeadline and nodePreference', () => {
    const config = baseConfig();
    config.defaultDeadline = 15000;
    config.nodePreference = 'follower';
    const params = paramsOf(buildConnectionString(config));
    assert.strictEqual(params.defaultDeadline, '15000');
    assert.strictEqual(params.nodePreference, 'follower');
  });

  it('Should pass through boolean params including false values', () => {
    const config = baseConfig();
    config.throwOnAppendFailure = false;
    config.tlsVerifyCert = false;
    const params = paramsOf(buildConnectionString(config));
    assert.strictEqual(params.throwOnAppendFailure, 'false');
    assert.strictEqual(params.tlsVerifyCert, 'false');
  });

  it('Should keep boolean true values distinct from being omitted', () => {
    const config = baseConfig();
    config.throwOnAppendFailure = true;
    const params = paramsOf(buildConnectionString(config));
    assert.strictEqual(params.throwOnAppendFailure, 'true');
  });

  it('Should pass through the mutual TLS file paths', () => {
    const config = baseConfig();
    config.userCertFile = '/certs/user.crt';
    config.userKeyFile = '/certs/user.key';
    const params = paramsOf(buildConnectionString(config));
    assert.strictEqual(params.userCertFile, encodeURIComponent('/certs/user.crt'));
    assert.strictEqual(params.userKeyFile, encodeURIComponent('/certs/user.key'));
  });

  it('Should omit params that are not provided', () => {
    const config = baseConfig();
    config.maxDiscoverAttempts = 5;
    const params = paramsOf(buildConnectionString(config));
    assert.ok(!('keepAliveInterval' in params));
    assert.ok(!('nodePreference' in params));
    assert.ok(!('throwOnAppendFailure' in params));
    assert.ok(!('userCertFile' in params));
    assert.ok(!('userKeyFile' in params));
  });

  it('Should percent encode special characters in the credentials', () => {
    const config = baseConfig();
    config.credentials = { username: 'us@r', password: 'p@ss:w/rd?&#%' };
    const connectionString = buildConnectionString(config);
    assert.strictEqual(
      connectionString,
      'kurrentdb+discover://us%40r:p%40ss%3Aw%2Frd%3F%26%23%25@localhost:22117?tls=false'
    );
  });

  it('Should round trip special character credentials through the KurrentDB parser', () => {
    const config = baseConfig();
    config.credentials = { username: 'us@r', password: 'p@ss:w/rd?&#%' };
    const { defaultCredentials } = parseConnectionString(buildConnectionString(config));
    assert.deepStrictEqual(defaultCredentials, config.credentials);
  });
  it('Should round trip file paths and connection names holding special characters', () => {
    const config = baseConfig();
    config.tlsCAFile = '/certs/r&d ca?.pem';
    config.userCertFile = '/certs/r&d user.crt';
    config.userKeyFile = '/certs/100%/user.key';
    const parsed = parseConnectionString(buildConnectionString(config, 'reader&writer?1'));
    assert.strictEqual(parsed.tlsCAFile, config.tlsCAFile);
    assert.strictEqual(parsed.userCertFile, config.userCertFile);
    assert.strictEqual(parsed.userKeyFile, config.userKeyFile);
    assert.strictEqual(parsed.connectionName, 'reader&writer?1');
  });
});
