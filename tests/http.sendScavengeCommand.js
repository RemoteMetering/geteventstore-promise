import getHttpConfig from './support/getHttpConfig.js';
import EventStore from '../lib/index.js';

// Set KURRENTDB_MEM_DB=false to test on compose files 
xdescribe('Http Client - Send Scavenge Command', () => {
	it('Should send scavenge command', () => {
		const client = new EventStore.HTTPClient(getHttpConfig());
		return client.admin.scavenge();
	});
});