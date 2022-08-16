import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('gRPC Client - Get All Stream Events', () => {
	it('Should write events and read back all stream events', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getAllStreamEvents(testStream);
		assert.equal(evs.length, 1000);
		assert.equal(evs[0].data.id, 0);
		assert.equal(evs[999].data.id, 999);

		await client.close();
	}).timeout(5000);

	it('Should write events and read back all events from start event', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getAllStreamEvents(testStream, 250, 500);
		assert.equal(evs.length, 500);
		assert.equal(evs[0].data.id, 500);
		assert.equal(evs[499].data.id, 999);

		await client.close();
	}).timeout(5000);
});