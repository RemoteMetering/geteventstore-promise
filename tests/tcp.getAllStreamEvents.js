import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Get All Stream Events', () => {
	it('Should write events and read back all stream events', async() => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getAllStreamEvents(testStream);
		assert.equal(evs.length, 1000);
		assert.equal(evs[0].data.id, 0);
		assert.equal(evs[999].data.id, 999);
	});

	it('Should write events and read back all events from start event', async() => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getAllStreamEvents(testStream, 250, 500);
		assert.equal(evs.length, 500);
		assert.equal(evs[0].data.id, 500);
		assert.equal(evs[499].data.id, 999);
	});
});