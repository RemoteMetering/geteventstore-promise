import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('GRPC Client - Get steam metadata', () => {
	it('Should return stream metadata', async function () {
		this.timeout(5000);
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		const streamMetadata = await client.getStreamMetadata(testStream);
		assert.equal(streamMetadata.streamName, testStream);

		await client.close();
	});
});