import assert from 'assert';

// Shared constructor validation for the cluster-aware clients (TCP and gRPC).
export default (config, baseErr) => {
  assert(config, `${baseErr}config not provided`);
  if (config.gossipSeeds) {
    assert(Array.isArray(config.gossipSeeds), `${baseErr}gossipSeeds must be an array`);
    assert(config.gossipSeeds.length >= 3, `${baseErr}at least 3 gossipSeeds are required`);

    config.gossipSeeds.forEach((seed) => {
      assert(seed.hostname, `${baseErr}gossip seed must have a hostname`);
      assert(seed.port, `${baseErr}gossip seed must have a port`);
    });
  } else {
    assert(config.hostname, `${baseErr}hostname property not provided`);
    assert(config.port, `${baseErr}port property not provided`);
  }
  assert(config.credentials, `${baseErr}credentials property not provided`);
  assert(config.credentials.username, `${baseErr}credentials.username property not provided`);
  assert(config.credentials.password, `${baseErr}credentials.password property not provided`);
  if (config.connectionNameGenerator)
    assert(
      typeof config.connectionNameGenerator === 'function',
      `${baseErr}connectionNameGenerator must be a function`
    );
};
