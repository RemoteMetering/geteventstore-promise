import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import chunkArray from '../lib/utilities/chunkArray';
import httpConfig from './support/httpConfig';
import sleep from './utilities/sleep';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('HTTP Client - Persistent Subscription', () => {
	it('Should get and ack first batch of events written to a stream', async function() {
		this.timeout(15 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		await client.writeEvents(testStream, events);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);

		const result = await client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10);
		assert.equal(10, result.entries.length);
		await result.ackAll();

		const psEvents = await client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10);
		assert.equal(0, psEvents.entries.length);
	});

	it('Should ack and nack messages individually', async function() {
		this.timeout(20 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 12; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		await client.writeEvents(testStream, events);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);
		await sleep(1000);
		const result = await client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 100);
		assert.equal(12, result.entries.length);
		const chunks = chunkArray(result.entries, 4);

		await Promise.all(chunks[0].map(entry => entry.nack()));
		await Promise.all(chunks[1].map(entry => entry.ack()));
		await Promise.all(chunks[2].map(entry => entry.nack()));

		const psEvents = await client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10);
		assert.equal(8, psEvents.entries.length);
		assert.equal(0, psEvents.entries[7].event.data.id);
		assert.equal(1, psEvents.entries[6].event.data.id);
		assert.equal(2, psEvents.entries[5].event.data.id);
		assert.equal(3, psEvents.entries[4].event.data.id);
		assert.equal(8, psEvents.entries[3].event.data.id);
		assert.equal(9, psEvents.entries[2].event.data.id);
		assert.equal(10, psEvents.entries[1].event.data.id);
		assert.equal(11, psEvents.entries[0].event.data.id);
	});

	it('Should update persistent subscription ', async function() {
		this.timeout(15 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 12; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		await client.writeEvents(testStream, events);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);

		const options = {
			readBatchSize: 121,
			resolveLinkTos: true
		};
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream, options);

		const result = await client.persistentSubscriptions.getSubscriptionInfo(testSubscriptionName, testStream);
		assert.equal(options.readBatchSize, result.config.readBatchSize);
		assert.equal(options.resolveLinkTos, result.config.resolveLinktos);
	});

	it('Should delete persistent subscription', function(done) {
		this.timeout(15 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 12; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		client.writeEvents(testStream, events).then(() => client.persistentSubscriptions.assert(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.remove(testSubscriptionName, testStream).then(() => client.persistentSubscriptions.getEvents(testSubscriptionName, testStream, 10).then(() => {
			done('Should have not gotten events');
		}).catch(err => {
			try {
				assert.equal(404, err.response.status, 'Should have received 404');
			} catch (ex) {
				return done(ex.message);
			}
			done();
		})))).catch(done);
	});

	it('Should return persistent subscription info', async function() {
		this.timeout(15 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		await client.writeEvents(testStream, events);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);

		const result = await client.persistentSubscriptions.getSubscriptionInfo(testSubscriptionName, testStream);
		assert.equal(testSubscriptionName, result.groupName);
		assert.equal(testStream, result.eventStreamId);
	});

	it('Should return persistent subscriptions info for a stream', async function() {
		this.timeout(15 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		await client.writeEvents(testStream, events);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);

		const results = await client.persistentSubscriptions.getStreamSubscriptionsInfo(testStream);
		assert.equal(1, results.length);
	});

	it('Should return persistent subscriptions info for all', async function() {
		this.timeout(15 * 1000);
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${generateEventId()}`;

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		const testSubscriptionName = testStream;

		await client.writeEvents(testStream, events);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);
		const results = await client.persistentSubscriptions.getAllSubscriptionsInfo();
		assert.equal(6, results.length);
	});
});