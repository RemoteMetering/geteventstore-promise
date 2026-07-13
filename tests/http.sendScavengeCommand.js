import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

// Set KURRENTDB_MEM_DB=false to test on LTS
if (process.env.TESTS_V21 === 'true') {
	describe('Http Client - Send Scavenge Command', () => {
		it('Should send scavenge command', () => {
			const client = new KurrentDB.HTTPClient(getHttpConfig());
			return client.admin.scavenge();
		});
	});
}