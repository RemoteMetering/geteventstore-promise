import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('gRPC Client - Get Events', () => {
	const testStream = `TestStream-${generateEventId()}`;
	const numberOfEvents = 10;

	before(async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [];

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}

		await client.writeEvents(testStream, events);

		await client.close();
	});

	it('Should get events reading forward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await client.getEvents(testStream, undefined, undefined, 'forward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 1);
		assert.equal('TestEventType', events[0].eventType);
		assert(events[0].created);
		assert(events[0].metadata === undefined);
		assert(events[0].isJson !== undefined);
		assert(typeof events[0].eventNumber === 'bigint', 'event number should be a bigint');

		await client.close();
	});

	it('Should get events reading backward', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = await client.getEvents(testStream, undefined, undefined, 'backward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
		assert(typeof events[0].eventNumber === 'bigint', 'event number should be a bigint');

		await client.close();
	});
});