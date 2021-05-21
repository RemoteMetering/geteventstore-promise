import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getHttpConfig from './support/getHttpConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('Http Client - Check Stream Exist', () => {
	it('Should return true when a stream exists', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		assert.equal(await client.checkStreamExists(testStream), true);
	}).timeout(5000);

	it('Should return false when a stream does not exist', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());
		assert.equal(await client.checkStreamExists('Non_existentStream'), false);
	});

	it('Should return rejected promise when the request error is anything other than a 404', callback => {
		const httpConfig = getHttpConfig();
		httpConfig.port = 1;
		const client = new EventStore.HTTPClient(httpConfig);

		client.checkStreamExists('Non_existentStream_wrong_port_config').then(() => {
			callback('Should not have returned successful promise');
		}).catch(err => {
			assert(err, 'No error received');
			assert(err.message.includes('ECONNREFUSED'), 'Connection refused error expected');
			callback();
		});
	}).timeout(5000);

	it('Should throw an exception when timeout is reached', callback => {
		const httpConfig = getHttpConfig();
		httpConfig.timeout = 0.00001;

		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;
		client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => client.checkStreamExists(testStream).then(() => {
			callback('Expected to fail');
		})).catch(err => {
			if (err.message.includes('timeout')) callback();
			else callback('Time out error expected');
		});
	});
});