import './_globalHooks.js';

import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
import EventStore from '../lib/index.js';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

const buildEvents = (count) => {
	const events = [];
	for (let k = 0; k < count; k++) {
		events.push(eventFactory.newEvent('TestEventType', {
			id: k
		}));
	}
	return events;
};

const collect = async (iterable) => {
	const events = [];
	for await (const event of iterable) {
		events.push(event);
	}
	return events;
};

describe('TCP Client - Iterate All Stream Events', () => {
	it('Should write events and iterate all stream events', async () => {
		const client = new EventStore.TCPClient(getTcpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const evs = await collect(client.iterateAllStreamEvents(testStream));
		assert.equal(evs.length, 1000);
		assert.equal(evs[0].data.id, 0);
		assert.equal(evs[999].data.id, 999);

		await client.close();
	}).timeout(5000);

	it('Should write events and iterate all events from start event', async () => {
		const client = new EventStore.TCPClient(getTcpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const evs = await collect(client.iterateAllStreamEvents(testStream, 250, 500));
		assert.equal(evs.length, 500);
		assert.equal(evs[0].data.id, 500);
		assert.equal(evs[499].data.id, 999);

		await client.close();
	}).timeout(5000);

	it('Should page across multiple chunks and preserve order', async () => {
		const client = new EventStore.TCPClient(getTcpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const evs = await collect(client.iterateAllStreamEvents(testStream, 100));
		assert.equal(evs.length, 1000);
		evs.forEach((event, index) => assert.equal(event.data.id, index));

		await client.close();
	}).timeout(5000);

	it('Should yield lazily and stop when the consumer stops early', async () => {
		const client = new EventStore.TCPClient(getTcpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const firstTen = [];
		for await (const event of client.iterateAllStreamEvents(testStream, 100)) {
			firstTen.push(event);
			if (firstTen.length === 10) break;
		}
		assert.equal(firstTen.length, 10);
		assert.equal(firstTen[0].data.id, 0);
		assert.equal(firstTen[9].data.id, 9);

		await client.close();
	}).timeout(5000);
});
