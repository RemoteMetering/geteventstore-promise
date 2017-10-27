import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import assert from 'assert';

describe('Http Client - Ping', () => {
	it('Should return successful when OK', () => {
		const client = eventstore.http(httpConfig);
		return client.ping();
	});

	it('Should fail when not OK', function() {
		this.timeout(30000);
		const config = JSON.parse(JSON.stringify(httpConfig));
		config.hostname = 'MadeToFailHostName';

		const client = eventstore.http(config);

		return client.ping().then(() => {
			throw new Error('Should not succeed');
		}).catch(err => {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
		});
	});
});