import './_globalHooks';

import httpConfig from './support/httpConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('Http Client - Config', () => {
	it('Should return assertion error when config is undefined', done => {
		try {
			new EventStore.HTTPClient();
			done('Config should not pass assertion');
		} catch (err) {
			assert.equal(err === undefined, false);
			assert.equal(err.message, 'geteventstore-promise - HTTP client - config not provided');
			done();
		}
	});

	it('Should return assertion error when hostname is undefined', done => {
		try {
			const config = {
				port: 2113,
				credentials: {
					username: 'admin',
					password: 'changeit'
				}
			};
			new EventStore.HTTPClient(config);
			done();
		} catch (err) {
			assert.equal(err === undefined, false);
			assert.equal(err.message, 'geteventstore-promise - HTTP client - hostname property not provided');
			done();
		}
	});

	it('Should return assertion error when credentials are undefined', done => {
		try {
			const config = {
				hostname: 'localhost',
				port: 2113
			};
			new EventStore.HTTPClient(config);
			done();
		} catch (err) {
			assert.equal(err === undefined, false);
			assert.equal(err.message, 'geteventstore-promise - HTTP client - credentials property not provided');
			done();
		}
	});

	it('Should return http client when config is complete', done => {
		try {
			const client = new EventStore.HTTPClient(httpConfig);
			assert.equal(client !== undefined, true);
			done();
		} catch (err) {
			done(err);
		}
	});
});