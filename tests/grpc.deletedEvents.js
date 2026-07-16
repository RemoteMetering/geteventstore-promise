import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';
import sleep from './utilities/sleep.js';
import assert from 'assert';

const eventFactory = new KurrentDB.EventFactory();

// Deleted events are resolved-link records whose target stream has been removed. The
// $by_event_type system projection indexes every event into $et-<type> as a link. Once the
// source stream is tombstoned those links can no longer resolve, which is a deleted event.
describe('gRPC Client - Deleted Events', () => {
	const eventType = `DeletedType-${generateEventId()}`;
	const testStream = `TestStream-${generateEventId()}`;
	const byTypeStream = `$et-${eventType}`;
	const numberOfEvents = 5;

	before(async function () {
		this.timeout(30000);
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent(eventType, { something: i }));
		}
		await client.writeEvents(testStream, events);

		// Wait for the projection to index the events into $et-<type> before deleting the source.
		let indexed = [];
		for (let attempt = 0; attempt < 100 && indexed.length < numberOfEvents; attempt++) {
			await sleep(200);
			indexed = await client.getAllStreamEvents(byTypeStream);
		}
		assert.equal(indexed.length, numberOfEvents, 'projection did not index the events in time');

		// Tombstone the source stream so the indexed links become unresolvable (deleted).
		await client.deleteStream(testStream, true);
		await client.close();
	});

	it('Should return deleted events as unresolved markers by default', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const events = await client.getAllStreamEvents(byTypeStream);
		assert.equal(events.length, numberOfEvents, 'deleted events should still be returned so paging stays correct');
		events.forEach(event => {
			assert.equal(event.isResolved, false);
			assert.equal(event.data, null);
			assert.equal(event.metadata, null);
		});

		await client.close();
	}).timeout(10000);

	it('Should skip deleted events when includeDeleted is false', async () => {
		const client = new KurrentDB.GRPCClient({ ...getGRPCConfig(), includeDeleted: false });

		const events = await client.getAllStreamEvents(byTypeStream);
		assert.equal(events.length, 0, 'deleted events should be skipped when opted out');

		await client.close();
	}).timeout(10000);
});
