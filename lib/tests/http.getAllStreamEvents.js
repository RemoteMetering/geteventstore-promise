import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';

describe('Http Client - Get All Stream Events', () => {
	it('Should write events and read back all stream events', async() => {
		const client = eventstore.http(httpConfig);

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events);
		const allEvents = await client.getAllStreamEvents(testStream);
		assert.equal(allEvents.length, 1000);
		assert.equal(allEvents[0].data.id, 0);
		assert.equal(allEvents[999].data.id, 999);
	});

	it('Should write events and read back all events from start event', async() => {
		const client = eventstore.http(httpConfig);

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events)
		const allEvents = await client.getAllStreamEvents(testStream, 250, 500);
		assert.equal(allEvents.length, 500);
		assert.equal(allEvents[0].data.id, 500);
		assert.equal(allEvents[499].data.id, 999);
	});

	it('Should write events and read back stream events with embed type rich', async() => {
		const client = eventstore.http(httpConfig);

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events)
		const allEvents = await client.getAllStreamEvents(testStream, 1000, 0, true, 'rich');
		assert.equal(allEvents.length, 1000);
		assert.equal(allEvents[0].data, undefined);
	});
});