import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Get Events', () => {
	const testStream = `TestStream-${uuid.v4()}`;
	const numberOfEvents = 10;

	before(() => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = [];

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}

		return client.writeEvents(testStream, events);
	});

	it('Should get events reading forward', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = await client.getEvents(testStream, undefined, undefined, 'forward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 1);
		assert.equal('TestEventType', events[0].eventType);
		assert(events[0].created);
		assert(events[0].metadata !== undefined);
		assert(events[0].isJson !== undefined);
		assert(events[0].isJson !== undefined);
		assert(typeof events[0].eventNumber === 'number', 'event number should be a number');
	});

	it('Should get events reading backward', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const events = await client.getEvents(testStream, undefined, undefined, 'backward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
		assert(typeof events[0].eventNumber === 'number', 'event number should be a number');
	});
});