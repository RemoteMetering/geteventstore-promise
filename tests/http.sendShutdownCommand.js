import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

// admin.shutdown is intentionally not integration-tested
describe.skip('HTTP Client - Send Shutdown Command', () => {
  it('Should send shutdown command', () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    return client.admin.shutdown();
  });
});
