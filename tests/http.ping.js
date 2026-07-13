import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';
import assert from 'assert';

describe('Http Client - Ping', () => {
	it('Should return successful when OK', () => {
		const client = new KurrentDB.HTTPClient(getHttpConfig());
		return client.ping();
	});

	it('Should fail when not OK', function() {
		this.timeout(30000);
		const config = getHttpConfig();
		config.hostname = 'MadeToFailHostName';

		const client = new KurrentDB.HTTPClient(config);

		return client.ping().then(() => {
			throw new Error('Should not succeed');
		}).catch(err => {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
		});
	});
});