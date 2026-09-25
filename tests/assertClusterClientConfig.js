import assert from 'assert';
import assertClusterClientConfig from '../lib/utilities/assertClusterClientConfig.js';

const baseErr = 'Test client - ';

const validSingleNode = () => ({
  hostname: 'localhost',
  port: 2113,
  credentials: { username: 'admin', password: 'changeit' }
});

const validGossipCluster = () => ({
  gossipSeeds: [
    { hostname: 'node1', port: 1111 },
    { hostname: 'node2', port: 2222 },
    { hostname: 'node3', port: 3333 }
  ],
  credentials: { username: 'admin', password: 'changeit' }
});

describe('assertClusterClientConfig', () => {
  it('Should reject when config is undefined', () => {
    assert.throws(() => assertClusterClientConfig(undefined, baseErr), /config not provided/);
  });

  it('Should reject when hostname is missing on a single-node config', () => {
    const config = validSingleNode();
    delete config.hostname;
    assert.throws(() => assertClusterClientConfig(config, baseErr), /hostname property not provided/);
  });

  it('Should reject when port is missing on a single-node config', () => {
    const config = validSingleNode();
    delete config.port;
    assert.throws(() => assertClusterClientConfig(config, baseErr), /port property not provided/);
  });

  it('Should reject when credentials are missing', () => {
    const config = validSingleNode();
    delete config.credentials;
    assert.throws(() => assertClusterClientConfig(config, baseErr), /credentials property not provided/);
  });

  it('Should reject when credentials.username is missing', () => {
    const config = validSingleNode();
    config.credentials = { password: 'changeit' };
    assert.throws(() => assertClusterClientConfig(config, baseErr), /credentials.username property not provided/);
  });

  it('Should reject when credentials.password is missing', () => {
    const config = validSingleNode();
    config.credentials = { username: 'admin' };
    assert.throws(() => assertClusterClientConfig(config, baseErr), /credentials.password property not provided/);
  });

  it('Should accept a valid single-node config', () => {
    assert.doesNotThrow(() => assertClusterClientConfig(validSingleNode(), baseErr));
  });

  it('Should reject when gossipSeeds is not an array', () => {
    const config = validGossipCluster();
    config.gossipSeeds = 'not-an-array';
    assert.throws(() => assertClusterClientConfig(config, baseErr), /gossipSeeds must be an array/);
  });

  it('Should reject when fewer than 3 gossipSeeds are provided', () => {
    const config = validGossipCluster();
    config.gossipSeeds = config.gossipSeeds.slice(0, 2);
    assert.throws(() => assertClusterClientConfig(config, baseErr), /at least 3 gossipSeeds are required/);
  });

  it('Should reject when a gossip seed is missing a hostname', () => {
    const config = validGossipCluster();
    delete config.gossipSeeds[0].hostname;
    assert.throws(() => assertClusterClientConfig(config, baseErr), /gossip seed must have a hostname/);
  });

  it('Should reject when a gossip seed is missing a port', () => {
    const config = validGossipCluster();
    delete config.gossipSeeds[1].port;
    assert.throws(() => assertClusterClientConfig(config, baseErr), /gossip seed must have a port/);
  });

  it('Should accept a valid gossip-cluster config', () => {
    assert.doesNotThrow(() => assertClusterClientConfig(validGossipCluster(), baseErr));
  });

  it('Should reject when connectionNameGenerator is not a function', () => {
    const config = validSingleNode();
    config.connectionNameGenerator = 'not-a-function';
    assert.throws(() => assertClusterClientConfig(config, baseErr), /connectionNameGenerator must be a function/);
  });

  it('Should accept a config with a function connectionNameGenerator', () => {
    const config = validSingleNode();
    config.connectionNameGenerator = () => 'connection-name';
    assert.doesNotThrow(() => assertClusterClientConfig(config, baseErr));
  });
});
