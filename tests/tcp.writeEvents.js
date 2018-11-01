import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Write Events', () => {
	it('Write to a new stream and read the events', async() => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = [eventFactory.newEvent('TestEventType', {
			something: '456'
		})];

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');
	});

	it('Write to a new stream and read the events by type', async() => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = [eventFactory.newEvent('TestEventType', {
			something: '456'
		}), eventFactory.newEvent('ToBeIgnoredType', {
			something: '789'
		})];

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEventsByType(testStream, ['TestEventType']);
		assert.equal(evs.length, 1);
		assert.equal(evs[0].eventType, 'TestEventType');
		assert.equal(evs[0].data.something, '456');
	});

	it('Should not fail promise if no events provided', () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = [];
		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvents(testStream, events);
	});

	it('Should fail promise if non array provided', () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = {
			something: 'here'
		};

		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvents(testStream, events).then(() => {
			assert.fail('should not have succeeded');
		}).catch(err => {
			assert(err, 'error expected');
		});
	});
});