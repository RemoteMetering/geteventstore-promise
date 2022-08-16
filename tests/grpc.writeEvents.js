import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getGRPCConfig from './support/getGRPCConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('gRPC Client - Write Events', () => {
	it('Write to a new stream and read the events', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [eventFactory.newEvent('TestEventType', {
			something: '456'
		})];

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');

		await client.close();
	});

	it('Write to a new stream and read the events by type', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [eventFactory.newEvent('TestEventType', {
			something: '456'
		}), eventFactory.newEvent('ToBeIgnoredType', {
			something: '789'
		})];

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEventsByType(testStream, ['TestEventType']);
		assert.equal(evs.length, 1);
		assert.equal(evs[0].eventType, 'TestEventType');
		assert.equal(evs[0].data.something, '456');

		await client.close();
	});

	it('Should not fail promise if no events provided', async () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = [];
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);
	});

	it('Should fail promise if non array provided', () => {
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const events = {
			something: 'here'
		};

		const testStream = `TestStream-${generateEventId()}`;
		return client.writeEvents(testStream, events).then(async () => {
			await client.close();
			assert.fail('should not have succeeded');
		}).catch(err => {
			assert(err, 'error expected');
		});
	});
});

describe('gRPC Client - Write Events to pre-populated stream', () => {
	let client,
		testStream,
		events,
		events2;

	beforeEach(async () => {
		client = new EventStore.GRPCClient(getGRPCConfig());

		events = [eventFactory.newEvent('TestEventType', {
			something: '456'
		}), eventFactory.newEvent('ToBeIgnoredType', {
			something: '789'
		})];

		testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		events2 = [eventFactory.newEvent('TestEventType', {
			something: 'abc'
		})];
	});

	afterEach(async () => {
		await client.close();
	});

	it('Should fail promise if passed in wrong expectedVersion (covering edge case of expectedVersion=0)', async () => {
		try {
			await client.writeEvents(testStream, events2, {
				expectedVersion: "WRONG"
			});
		} catch (err) {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
			return;
		}
		assert.fail('Write should not have succeeded');
	});

	it('Should write event if expectedVersion=null', async () => {
		try {
			await client.writeEvents(testStream, events2, {
				expectedVersion: null
			});
		} catch (err) {
			assert.fail('Write should not have failed');
		}
	});
});