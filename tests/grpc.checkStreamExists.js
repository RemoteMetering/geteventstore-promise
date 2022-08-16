import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('GRPC Client - Check Stream Exist', () => {
	it('Should return true when a stream exists', async function () {
		this.timeout(5000);
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		assert.equal(await client.checkStreamExists(testStream), true);

		await client.close();
	});

	it('Should return false when a stream does not exist', async function () {
		this.timeout(5000);
		const client = new EventStore.GRPCClient(getGRPCConfig());

		assert.equal(await client.checkStreamExists('Non_existentStream'), false);

		await client.close();
	});
});