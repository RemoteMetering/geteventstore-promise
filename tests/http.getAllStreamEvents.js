import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getHttpConfig from './support/getHttpConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('Http Client - Get All Stream Events', () => {
	it('Should write events and read back all stream events', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);
		const allEvents = await client.getAllStreamEvents(testStream);
		assert.equal(allEvents.length, 1000);
		assert(allEvents[0].created, 'Created should be defined');
		assert.equal(allEvents[0].data.id, 0);
		assert.equal(allEvents[999].data.id, 999);
	}).timeout(5000);

	it('Should write events and read back all events from start event', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);
		const allEvents = await client.getAllStreamEvents(testStream, 250, 500);
		assert.equal(allEvents.length, 500);
		assert.equal(allEvents[0].data.id, 500);
		assert.equal(allEvents[499].data.id, 999);
	}).timeout(5000);

	it('Should write events and read back stream events with embed type rich', async() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = [];
		for (let k = 0; k < 1000; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);
		const allEvents = await client.getAllStreamEvents(testStream, 1000, 0, true, 'rich');
		assert.equal(allEvents.length, 1000);
		assert.equal(allEvents[0].data, undefined);
	}).timeout(5000);
});