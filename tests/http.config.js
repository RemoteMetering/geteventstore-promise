import assert from 'assert';
import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

describe('Http Client - Config', () => {
  it('Should return assertion error when config is undefined', (done) => {
    try {
      // Constructed purely to trigger the config assertion
      // eslint-disable-next-line no-new
      new KurrentDB.HTTPClient();
      done('Config should not pass assertion');
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'HTTP client - config not provided');
      done();
    }
  });

  it('Should return assertion error when hostname is undefined', (done) => {
    try {
      const config = {
        port: 2113,
        credentials: {
          username: 'admin',
          password: 'changeit'
        }
      };
      // Constructed purely to trigger the config assertion
      // eslint-disable-next-line no-new
      new KurrentDB.HTTPClient(config);
      done();
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'HTTP client - hostname property not provided');
      done();
    }
  });

  it('Should return assertion error when credentials are undefined', (done) => {
    try {
      const config = {
        hostname: 'localhost',
        port: 2113
      };
      // Constructed purely to trigger the config assertion
      // eslint-disable-next-line no-new
      new KurrentDB.HTTPClient(config);
      done();
    } catch (err) {
      assert.equal(err === undefined, false);
      assert.equal(err.message, 'HTTP client - credentials property not provided');
      done();
    }
  });

  it('Should return http client when config is complete', (done) => {
    try {
      const client = new KurrentDB.HTTPClient(getHttpConfig());
      assert.equal(client !== undefined, true);
      done();
    } catch (err) {
      done(err);
    }
  });
});
