import assert from 'assert';
import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

describe('Http Client - Ping', () => {
  it('Should return successful when OK', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    await client.ping();
  });

  it('Should fail when not OK', async function () {
    this.timeout(30000);
    const config = getHttpConfig();
    config.hostname = 'MadeToFailHostName';

    const client = new KurrentDB.HTTPClient(config);

    try {
      await client.ping();
    } catch (err) {
      assert(err, 'Error expected');
      assert(err.message, 'Error Message Expected');
      return;
    }
    throw new Error('Should not succeed');
  });
});
