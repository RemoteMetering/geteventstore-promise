import assert from 'assert';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

describe('gRPC Client - Config', () => {
  it('Should return assertion error when config is undefined', (done) => {
    try {
      // Constructed purely to trigger the config assertion
      new KurrentDB.GRPCClient();
      done('Config should not pass assertion');
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'gRPC client - config not provided');
      done();
    }
  });

  it('Should return assertion error when hostname is undefined', (done) => {
    try {
      const config = {
        port: 1113,
        credentials: {
          username: 'admin',
          password: 'changeit'
        }
      };
      // Constructed purely to trigger the config assertion
      new KurrentDB.GRPCClient(config);
      done('Config should not pass assertion');
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'gRPC client - hostname property not provided');
      done();
    }
  });

  it('Should return assertion error when credentials are undefined', (done) => {
    try {
      const config = {
        hostname: 'localhost',
        port: 1113
      };
      // Constructed purely to trigger the config assertion
      new KurrentDB.GRPCClient(config);
      done('Config should not pass assertion');
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'gRPC client - credentials property not provided');
      done();
    }
  });

  it('Should return tcp client when config is complete', (done) => {
    try {
      const client = new KurrentDB.GRPCClient(getGRPCConfig());
      assert.equal(client !== undefined, true);
      done();
    } catch (err) {
      done(err);
    }
  });
});
