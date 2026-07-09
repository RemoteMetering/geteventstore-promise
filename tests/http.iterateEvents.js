import './_globalHooks.js';

import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
import EventStore from '../lib/index.js';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

const collect = async (iterable) => {
	const events = [];
	for await (const event of iterable) {
		events.push(event);
	}
	return events;
};

describe('Http Client - Iterate Events', () => {
	const testStream = `TestStream-${generateEventId()}`;
	const numberOfEvents = 10;

	before(async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			const type = i % 2 === 0 ? 'EvenType' : 'OddType';
			events.push(eventFactory.newEvent(type, { something: i }));
		}

		await client.writeEvents(testStream, events);
	});

	it('Should iterate events reading forward', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEvents(testStream, undefined, undefined, 'forward'));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 1);
		assert.equal(events[0].eventType, 'OddType');
		assert(events[0].created);
	});

	it('Should iterate events reading backward', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEvents(testStream, undefined, undefined, 'backward'));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
	});

	it('Should iterate events forward via iterateEventsForward', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEventsForward(testStream));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 1);
	});

	it('Should iterate events backward via iterateEventsBackward', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEventsBackward(testStream));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
	});

	it('Should respect the count bound', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEvents(testStream, 0, 4, 'forward'));
		assert.equal(events.length, 4);
		assert.equal(events[0].data.something, 1);
		assert.equal(events[3].data.something, 4);
	});

	it('Should iterate events with embed type rich', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEventsForward(testStream, 0, 10, true, 'rich'));
		assert.equal(events.length, 10);
		assert.equal(events[0].data, undefined);
	});

	it('Should iterate only events matching the requested types', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = await collect(client.iterateEventsByType(testStream, ['EvenType']));
		assert.equal(events.length, 5);
		events.forEach(event => assert.equal(event.eventType, 'EvenType'));
	});
});
