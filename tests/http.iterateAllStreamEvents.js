import './_globalHooks.js';

import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
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

describe('Http Client - Iterate All Stream Events', () => {
	it('Should write events and iterate all stream events', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const allEvents = await collect(client.iterateAllStreamEvents(testStream));
		assert.equal(allEvents.length, 1000);
		assert(allEvents[0].created, 'Created should be defined');
		assert.equal(allEvents[0].data.id, 0);
		assert.equal(allEvents[999].data.id, 999);
	}).timeout(5000);

	it('Should write events and iterate all events from start event', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const allEvents = await collect(client.iterateAllStreamEvents(testStream, 250, 500));
		assert.equal(allEvents.length, 500);
		assert.equal(allEvents[0].data.id, 500);
		assert.equal(allEvents[499].data.id, 999);
	}).timeout(5000);

	it('Should page across multiple chunks and preserve order', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const allEvents = await collect(client.iterateAllStreamEvents(testStream, 100));
		assert.equal(allEvents.length, 1000);
		allEvents.forEach((event, index) => assert.equal(event.data.id, index));
	}).timeout(5000);

	it('Should yield lazily and stop when the consumer stops early', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

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
	}).timeout(5000);

	it('Should iterate stream events with embed type rich', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, buildEvents(1000));

		const allEvents = await collect(client.iterateAllStreamEvents(testStream, 1000, 0, true, 'rich'));
		assert.equal(allEvents.length, 1000);
		assert.equal(allEvents[0].data, undefined);
	}).timeout(5000);
});
