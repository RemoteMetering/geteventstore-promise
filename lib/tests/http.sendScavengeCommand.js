import './_globalHooks';

import httpConfig from './support/httpConfig';
import EventStore from '../index';

describe('Http Client - Send Scavenge Command', () => {
	it('Should send scavenge command', () => {
		const client = new EventStore.HTTPClient(httpConfig);
		return client.admin.scavenge();
	});
});