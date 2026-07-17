import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

const describeForScavenge = process.env.TESTS_V21 === 'true' ? describe : describe.skip;

// Set KURRENTDB_MEM_DB=false to test on LTS
describeForScavenge('Http Client - Send Scavenge Command', () => {
  it('Should send scavenge command', () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    return client.admin.scavenge();
  });
});
