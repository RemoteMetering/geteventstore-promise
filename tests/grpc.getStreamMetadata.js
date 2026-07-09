import './_globalHooks.js';

import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import EventStore from '../lib/index.js';
import assert from 'assert';

describe('gRPC Client - Get steam metadata', () => {
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