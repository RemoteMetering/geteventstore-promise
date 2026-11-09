import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';
import { describeOnlyV21 } from './support/v21.js';

// Set KURRENTDB_MEM_DB=false to test on LTS
describeOnlyV21('Http Client - Send Scavenge Command', () => {
  it('Should send scavenge command', () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    return client.admin.scavenge();
  });
});
