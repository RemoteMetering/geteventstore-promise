import './_globalHooks';

import getHttpConfig from './support/getHttpConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('Http Client - Ping', () => {
	it('Should return successful when OK', () => {
		const client = new EventStore.HTTPClient(getHttpConfig());
		return client.ping();
	});

	it('Should fail when not OK', function() {
		this.timeout(30000);
		const config = getHttpConfig();
		config.hostname = 'MadeToFailHostName';

		const client = new EventStore.HTTPClient(config);

		return client.ping().then(() => {
			throw new Error('Should not succeed');
		}).catch(err => {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
		});
	});
});