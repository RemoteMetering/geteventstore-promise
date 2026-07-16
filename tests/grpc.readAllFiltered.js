import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB, { eventTypeFilter, streamNameFilter } from '../lib/index.js';
import assert from 'assert';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Server-side filtered $all reads', () => {
	it('readAllEventsBackward should return only events matching an event type filter', async function () {
		this.timeout(10 * 1000);
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		// A unique event type means our events are the only matches anywhere in $all.
		const eventType = `FilteredReadType-${generateEventId()}`;
		const testStream = `TestStream-${generateEventId()}`;
		const events = [];
		for (let k = 0; k < 10; k++) events.push(eventFactory.newEvent(eventType, { id: k }));
		await client.writeEvents(testStream, events);

		// Read backward from the end so the just-written events are found without
		// scanning the whole log.
		const result = await client.readAllEventsBackward('end', 100, false, eventTypeFilter({ prefixes: [eventType] }));

		assert.equal(result.events.length, 10, 'expect exactly the 10 filtered events');
		assert(result.events.every(e => e.eventType === eventType), 'expect only the filtered event type');

		await client.close();
	});

	it('readAllEventsBackward should return only events matching a stream prefix filter', async function () {
		this.timeout(10 * 1000);
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const prefix = `FilteredStream-${generateEventId()}`;
		const testStream = `${prefix}-events`;
		const events = [];
		for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
		await client.writeEvents(testStream, events);

		const result = await client.readAllEventsBackward('end', 100, false, streamNameFilter({ prefixes: [prefix] }));

		assert.equal(result.events.length, 5, 'expect exactly the 5 events on the prefixed stream');
		assert(result.events.every(e => e.streamId === testStream), 'expect only events from the prefixed stream');

		await client.close();
	});
});
