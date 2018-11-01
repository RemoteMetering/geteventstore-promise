import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Event Enumerator', () => {
	describe('Forward: Reading events', () => {
		it('Read next events', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream);
			let result = await enumerator.next(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[19].data.id, 19);

			result = await enumerator.next(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 20);
			assert.equal(result.events[19].data.id, 39);
		});

		it('Read first 10 events, next 20 events, previous 30 events', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream);
			let result = await enumerator.first(10);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[9].data.id, 9);

			result = await enumerator.next(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 10);
			assert.equal(result.events[19].data.id, 29);

			result = await enumerator.previous(30);
			assert.equal(result.events.length, 30);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[29].data.id, 29);
		});

		it('Read last 10 events, previous 30 events, next 30 events', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream);
			let result = await enumerator.last(10);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 90);
			assert.equal(result.events[9].data.id, 99);

			result = await enumerator.previous(30);
			assert.equal(result.events.length, 30);
			assert.equal(result.events[0].data.id, 70);
			assert.equal(result.events[29].data.id, 99);

			result = await enumerator.next(30);
			assert.equal(result.events.length, 30);
			assert.equal(result.events[0].data.id, 70);
			assert.equal(result.events[29].data.id, 99);
		});

		it('Read first and last batch', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream);
			let result = await enumerator.first(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[19].data.id, 19);

			result = await enumerator.last(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 80);
			assert.equal(result.events[19].data.id, 99);
		});

		it('Handle out of bounds Enumeration Request ', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream);
			let result = await enumerator.first(95);
			assert.equal(result.events.length, 95);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[94].data.id, 94);

			result = await enumerator.next(20);
			assert.equal(result.events.length, 5);
			assert.equal(result.events[0].data.id, 95);
			assert.equal(result.events[4].data.id, 99);

			result = await enumerator.first(10);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[9].data.id, 9);

			result = await enumerator.previous(20);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 0);
			assert.equal(result.events[9].data.id, 9);
		});
	});

	describe('Backward: Reading events', () => {
		it('Read next events', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream, 'backward');
			let result = await enumerator.next(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[19].data.id, 80);

			result = await enumerator.next(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 79);
			assert.equal(result.events[19].data.id, 60);
		});

		it('Read first 10 events, next 20 events, previous 30 events', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream, 'backward');
			let result = await enumerator.first(10);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[9].data.id, 90);

			result = await enumerator.next(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 89);
			assert.equal(result.events[19].data.id, 70);

			result = await enumerator.previous(30);
			assert.equal(result.events.length, 30);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[29].data.id, 70);
		});

		it('Read last 10 events, previous 20 events, next 30 events', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream, 'backward');
			let result = await enumerator.last(10);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 9);
			assert.equal(result.events[9].data.id, 0);

			result = await enumerator.previous(30);
			assert.equal(result.events.length, 30);
			assert.equal(result.events[0].data.id, 29);
			assert.equal(result.events[29].data.id, 0);

			result = await enumerator.next(30);
			assert.equal(result.events.length, 30);
			assert.equal(result.events[0].data.id, 29);
			assert.equal(result.events[29].data.id, 0);
		});

		it('Read first and last batch', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const enumerator = client.eventEnumerator(testStream, 'backward');
			let result = await enumerator.first(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[19].data.id, 80);

			result = await enumerator.last(20);
			assert.equal(result.events.length, 20);
			assert.equal(result.events[0].data.id, 19);
			assert.equal(result.events[19].data.id, 0);
		});

		it('Handle out of bounds Enumeration Request ', async() => {
			const client = new EventStore.TCPClient(tcpConfig);

			const events = [];
			for (let k = 0; k < 100; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}

			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);
			const enumerator = client.eventEnumerator(testStream, 'backward');
			let result = await enumerator.first(95);
			assert.equal(result.events.length, 95);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[94].data.id, 5);

			result = await enumerator.next(20);
			assert.equal(result.events.length, 5);
			assert.equal(result.events[0].data.id, 4);
			assert.equal(result.events[4].data.id, 0);

			result = await enumerator.first(10);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[9].data.id, 90);

			result = await enumerator.previous(20);
			assert.equal(result.events.length, 10);
			assert.equal(result.events[0].data.id, 99);
			assert.equal(result.events[9].data.id, 90);
		});
	});
});