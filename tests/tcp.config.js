import assert from 'assert';
import getTcpConfig from './support/getTcpConfig.js';
import KurrentDB from '../lib/index.js';

describe('TCP Client - Config', () => {
  it('Should return assertion error when config is undefined', (done) => {
    try {
      // Constructed purely to trigger the config assertion
      new KurrentDB.TCPClient();
      done('Config should not pass assertion');
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'TCP client - config not provided');
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
      new KurrentDB.TCPClient(config);
      done();
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'TCP client - hostname property not provided');
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
      new KurrentDB.TCPClient(config);
      done();
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'TCP client - credentials property not provided');
      done();
    }
  });

  it('Should return tcp client when config is complete', (done) => {
    try {
      const client = new KurrentDB.TCPClient(getTcpConfig());
      assert.equal(client !== undefined, true);
      done();
    } catch (err) {
      done(err);
    }
  });
});
