import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

const collect = async (iterable) => {
	const events = [];
	for await (const event of iterable) {
		events.push(event);
	}
	return events;
};

describe('gRPC Client - Iterate Events', () => {
	const testStream = `TestStream-${generateEventId()}`;
	const numberOfEvents = 10;

	before(async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			const type = i % 2 === 0 ? 'EvenType' : 'OddType';
			events.push(eventFactory.newEvent(type, { something: i }));
		}

		await client.writeEvents(testStream, events);
		await client.close();
	});

	it('Should iterate events reading forward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateEvents(testStream, undefined, undefined, 'forward'));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 1);
		assert.equal(events[0].eventType, 'OddType');
		assert(events[0].created);

		await client.close();
	});

	it('Should iterate events reading backward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateEvents(testStream, undefined, undefined, 'backward'));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);

		await client.close();
	});

	it('Should iterate events forward via iterateEventsForward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateEventsForward(testStream));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 1);

		await client.close();
	});

	it('Should iterate events backward via iterateEventsBackward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateEventsBackward(testStream));
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);

		await client.close();
	});

	it('Should respect the count bound', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateEvents(testStream, 0, 4, 'forward'));
		assert.equal(events.length, 4);
		assert.equal(events[0].data.something, 1);
		assert.equal(events[3].data.something, 4);

		await client.close();
	});

	it('Should yield lazily and stop when the consumer stops early', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const seen = [];
		for await (const event of client.iterateEventsForward(testStream)) {
			seen.push(event);
			if (seen.length === 3) break;
		}
		assert.equal(seen.length, 3);
		assert.equal(seen[0].data.something, 1);

		await client.close();
	});

	it('Should iterate only events matching the requested types', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateEventsByType(testStream, ['EvenType']));
		assert.equal(events.length, 5);
		events.forEach(event => assert.equal(event.eventType, 'EvenType'));

		await client.close();
	});

	it('Should iterate $all events', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateAllEvents());
		assert(events.length > 0, 'Expected events');

		await client.close();
	});

	it('Should iterate $all events forward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateAllEventsForward());
		assert(events.length > 0, 'Expected events');

		await client.close();
	});

	it('Should iterate $all events backward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await collect(client.iterateAllEventsBackward());
		assert(events.length > 0, 'Expected events');

		await client.close();
	});
});
