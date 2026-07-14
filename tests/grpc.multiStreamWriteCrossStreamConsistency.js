import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';
import assert from 'assert';

const eventFactory = new KurrentDB.EventFactory();

const describeMultiStreamWrite = process.env.TESTS_V21 === 'true' ? describe.skip : describe;

describeMultiStreamWrite('gRPC Client - Multi Stream Write Cross Stream Consistency', () => {
	it('Writes interleaved records to multiple streams in one transaction and preserves per stream order', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;
		const streamB = `TestStream-${generateEventId()}`;

		const result = await client.multiStreamWriteCrossStreamConsistency([
			{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a1' }) },
			{ streamName: streamB, event: eventFactory.newEvent('TestEventType', { something: 'b1' }) },
			{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a2' }) }
		]);

		assert(result, 'result expected');
		assert.equal(result.responses.length, 2, 'a response per written stream expected');
		assert(typeof result.position === 'bigint', 'transaction position expected');

		const eventsA = await client.getEvents(streamA);
		const eventsB = await client.getEvents(streamB);
		assert.equal(eventsA.length, 2);
		assert.equal(eventsA[0].data.something, 'a1');
		assert.equal(eventsA[1].data.something, 'a2');
		assert.equal(eventsB.length, 1);
		assert.equal(eventsB[0].data.something, 'b1');

		await client.close();
	});

	it('Returns the resulting final revision for each written stream', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;
		const streamB = `TestStream-${generateEventId()}`;

		const result = await client.multiStreamWriteCrossStreamConsistency([
			{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a1' }) },
			{ streamName: streamB, event: eventFactory.newEvent('TestEventType', { something: 'b1' }) },
			{ streamName: streamB, event: eventFactory.newEvent('TestEventType', { something: 'b2' }) }
		]);

		const byStream = Object.fromEntries(result.responses.map(r => [r.streamName, r.revision]));
		assert.equal(byStream[streamA], 0n, 'single record leaves stream A at revision 0');
		assert.equal(byStream[streamB], 1n, 'two records leave stream B at revision 1');

		await client.close();
	});

	it('Carries string valued event metadata through to each record', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;
		const streamB = `TestStream-${generateEventId()}`;

		await client.multiStreamWriteCrossStreamConsistency([
			{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a1' }, { source: 'stream-a' }) },
			{ streamName: streamB, event: eventFactory.newEvent('TestEventType', { something: 'b1' }, { source: 'stream-b' }) }
		]);

		const eventsA = await client.getEvents(streamA);
		const eventsB = await client.getEvents(streamB);
		// The server adds its own $schema.* properties, so assert on the caller keys only
		assert.equal(eventsA[0].metadata.source, 'stream-a');
		assert.equal(eventsB[0].metadata.source, 'stream-b');

		await client.close();
	});

	it('Rejects the transaction when metadata is not string valued', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;

		let succeeded = false;
		try {
			await client.multiStreamWriteCrossStreamConsistency([
				{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a1' }, { count: 5 }) }
			]);
			succeeded = true;
		} catch (err) {
			assert(err, 'error expected');
		}
		assert(!succeeded, 'Multi stream write should not have succeeded with non string metadata');

		// The stream must never have been created
		assert.equal(await client.checkStreamExists(streamA), false, 'stream A should not exist');

		await client.close();
	});

	it('Commits when a consistency check passes', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;

		const result = await client.multiStreamWriteCrossStreamConsistency(
			[{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a1' }) }],
			[{ streamName: streamA, expectedVersion: 'no_stream' }]
		);

		assert.equal(result.responses.length, 1);
		const eventsA = await client.getEvents(streamA);
		assert.equal(eventsA.length, 1);
		assert.equal(eventsA[0].data.something, 'a1');

		await client.close();
	});

	it('Rejects atomically when a consistency check fails, even on a stream it does not write to', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;
		const streamB = `TestStream-${generateEventId()}`;

		// Seed stream A so it sits at revision 0
		await client.writeEvent(streamA, 'TestEventType', { something: 'seed' });

		let succeeded = false;
		try {
			await client.multiStreamWriteCrossStreamConsistency(
				// Writes only to stream B
				[{ streamName: streamB, event: eventFactory.newEvent('TestEventType', { something: 'b1' }) }],
				// But checks stream A, which is at revision 0, not 999
				[{ streamName: streamA, expectedVersion: 999 }]
			);
			succeeded = true;
		} catch (err) {
			assert(err, 'error expected');
		}
		assert(!succeeded, 'Multi stream write should not have succeeded with a failing check');

		// Stream A must be untouched and stream B must never have been created
		const eventsA = await client.getEvents(streamA);
		assert.equal(eventsA.length, 1, 'stream A should still hold only the seed event');
		assert.equal(await client.checkStreamExists(streamB), false, 'stream B should not exist');

		await client.close();
	});

	it('Resolves without error when no writes are provided', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		// No connection is opened for an empty write, so there is no pool to close afterwards
		await client.multiStreamWriteCrossStreamConsistency([]);
	});

	it('Fails the promise when writes is not an array', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		try {
			await client.multiStreamWriteCrossStreamConsistency({ streamName: 'nope', event: {} });
		} catch (err) {
			assert(err, 'error expected');
			return;
		}
		await client.close();
		assert.fail('should not have succeeded');
	});

	it('Fails the promise when checks is provided but not an array', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;

		try {
			await client.multiStreamWriteCrossStreamConsistency(
				[{ streamName: streamA, event: eventFactory.newEvent('TestEventType', { something: 'a1' }) }],
				{ streamName: streamA, expectedVersion: 0 }
			);
		} catch (err) {
			assert(err, 'error expected');
			return;
		}
		await client.close();
		assert.fail('should not have succeeded');
	});

	it('Fails the promise when a write is missing its event', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const streamA = `TestStream-${generateEventId()}`;

		try {
			await client.multiStreamWriteCrossStreamConsistency([{ streamName: streamA }]);
		} catch (err) {
			assert(err, 'error expected');
			return;
		}
		await client.close();
		assert.fail('should not have succeeded');
	});
});
