import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import sleep from './utilities/sleep';
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

		const result = await client.readEventsForward(testStream);
		assert.equal(result.events.length, 10);
		assert.equal(result.events[0].data.something, 1);
		assert.equal('TestEventType', result.events[0].eventType);
		assert(result.events[0].created);
		assert(result.events[0].metadata !== undefined);
		assert(result.events[0].isJson !== undefined);
		assert(result.events[0].isJson !== undefined);
		assert(typeof result.events[0].eventNumber === 'number', 'event number should be a number');
	});

	it('Should get events reading backward', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const result = await client.readEventsBackward(testStream);
		assert.equal(result.events.length, 10);
		assert.equal(result.events[0].data.something, 10);
		assert(typeof result.events[0].eventNumber === 'number', 'event number should be a number');
	});

	it('Should get last event reading backward with larger size than events', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const result = await client.readEventsBackward(testStream, 0, 250);
		assert.equal(result.events.length, 1);
		assert.equal(result.events[0].data.something, 1);
		assert(typeof result.events[0].eventNumber === 'number', 'event number should be a number');
	});

	it('Should not get any events when start event is greater than the stream length', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const result = await client.readEventsForward(testStream, 11);
		assert.equal(result.events.length, 0);
	});

	it('Should get events reading backward from a start position', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const result = await client.readEventsBackward(testStream, 2);
		assert.equal(result.events.length, 3);
		assert.equal(result.events[0].data.something, 3);
		assert(typeof result.events[0].eventNumber === 'number', 'event number should be a number');
	});

	it('Should get events reading backward with a count greater than the stream length', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const result = await client.readEventsBackward(testStream, undefined, 10000);
		assert.equal(result.events.length, 10);
		assert.equal(result.events[0].data.something, 10);
		assert(typeof result.events[0].eventNumber === 'number', 'event number should be a number');
	});

	it('Should get events reading forward with a count greater than the stream length return a maximum of 4096', async function () {
		this.timeout(40000);
		const client = new EventStore.TCPClient(tcpConfig);

		const testStream = `TestStream-${uuid.v4()}`;
		const numberOfEvents = 5000;
		const events = [];

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}

		await client.writeEvents(testStream, events);
		const result = await client.readEventsForward(testStream, undefined, 5000);
		assert.equal(result.events.length, 4096);
		assert.equal(result.events[0].data.something, 1);
		assert.equal(result.events[4095].data.something, 4096);
	});

	it('Should get linked to events and map correctly', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const result = await client.readEventsForward('$ce-TestStream', 0, 1);
		assert.equal(result.events.length, 1);
		assert(result.events[0].data.something);
		assert(typeof result.events[0].eventNumber === 'number', 'event number should be a number');
		assert(typeof result.events[0].positionEventNumber === 'number', 'position event number should be a number');
		assert.equal(0, result.events[0].positionEventNumber, 'Position event number should be a number');
		assert.equal('$ce-TestStream', result.events[0].positionStreamId);
	});

	it('Should get system and deleted events without resolveLinkTos', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const deletedStream = 'TestStreamDeleted';
		await client.writeEvent(deletedStream, 'TestEventType', { something: 1 });

		await sleep(500);

		const result = await client.readEventsForward('$streams', 0, 4096, false);
		assert(result.events.length > 0, 'More than 0 events expected');
	});
});