import './_globalHooks';

import getHttpConfig from './support/getHttpConfig';
import EventStore from '../lib';

describe('Http Client - Send Scavenge Command', () => {
	it('Should send scavenge command', () => {
		const client = new EventStore.HTTPClient(getHttpConfig());
		return client.admin.scavenge();
	});
});