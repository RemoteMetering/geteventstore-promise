import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';
import assert from 'assert';

describe('Http Client - Check Stream Exist', () => {
	it('Should return true when a stream exists', async () => {
		const client = new KurrentDB.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		assert.equal(await client.checkStreamExists(testStream), true);
	}).timeout(5000);

	it('Should return false when a stream does not exist', async () => {
		const client = new KurrentDB.HTTPClient(getHttpConfig());
		assert.equal(await client.checkStreamExists('Non_existentStream'), false);
	});

	it('Should return rejected promise when the request error is anything other than a 404', async () => {
		const httpConfig = getHttpConfig();
		httpConfig.port = 1;
		const client = new KurrentDB.HTTPClient(httpConfig);

		try {
			await client.checkStreamExists('Non_existentStream_wrong_port_config');
		} catch (err) {
			assert(err, 'No error received');
			assert(err.message.includes('ECONNREFUSED'), 'Connection refused error expected');
			return;
		}
		assert.fail('Should not have returned successful promise');
	}).timeout(5000);

	it('Should throw an exception when timeout is reached', async () => {
		const httpConfig = getHttpConfig();
		httpConfig.timeout = 0.00001;

		const client = new KurrentDB.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;
		try {
			await client.writeEvent(testStream, 'TestEventType', {
				something: '123'
			});
			await client.checkStreamExists(testStream);
		} catch (err) {
			if (err.message.includes('timeout')) return;
			assert.fail('Time out error expected');
		}
		assert.fail('Expected to fail');
	});
});