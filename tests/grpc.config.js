import './_globalHooks';

import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('gRPC Client - Config', () => {
	it('Should return assertion error when config is undefined', done => {
		try {
			new EventStore.GRPCClient();
			done('Config should not pass assertion');
		} catch (err) {
			assert.equal(err === undefined, false);
			assert.equal(err.message, 'geteventstore-promise - gRPC client - config not provided');
			done();
		}
	});

	it('Should return assertion error when hostname is undefined', done => {
		try {
			const config = {
				port: 1113,
				credentials: {
					username: 'admin',
					password: 'changeit'
				}
			};
			new EventStore.GRPCClient(config);
			done();
		} catch (err) {
			assert.equal(err === undefined, false);
			assert.equal(err.message, 'geteventstore-promise - gRPC client - hostname property not provided');
			done();
		}
	});

	it('Should return assertion error when credentials are undefined', done => {
		try {
			const config = {
				hostname: 'localhost',
				port: 1113
			};
			new EventStore.GRPCClient(config);
			done();
		} catch (err) {
			assert.equal(err === undefined, false);
			assert.equal(err.message, 'geteventstore-promise - gRPC client - credentials property not provided');
			done();
		}
	});

	it('Should return tcp client when config is complete', done => {
		try {
			const client = new EventStore.GRPCClient(getGRPCConfig());
			assert.equal(client !== undefined, true);
			done();
		} catch (err) {
			done(err);
		}
	});
});