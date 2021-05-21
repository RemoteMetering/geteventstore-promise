import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import getHttpConfig from './support/getHttpConfig';
import sleep from './utilities/sleep';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('Http Client - Read Events', () => {
	const testStream = `TestStream-${generateEventId()}`;
	const numberOfEvents = 10;

	before(() => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}
		return client.writeEvents(testStream, events);
	});

	it('Should read events reading forward', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsForward(testStream);
		assert.equal(result.events.length, 10);
		assert(result.events[0].created, 'Created should be defined');
		assert.equal(result.events[0].data.something, 1);
	});

	it('Should read events reading backward', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsBackward(testStream);
		assert.equal(result.events.length, 10);
		assert.equal(result.events[0].data.something, 10);
	});

	it('Should read last event reading backward with larger size than events', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsBackward(testStream, 0, 250);
		assert.equal(result.events.length, 1);
		assert.equal(result.events[0].data.something, 1);
	});

	it('Should not get any events when start event is greater than the stream length', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsForward(testStream, 11);
		assert.equal(result.events.length, 0);
	});

	it('Should read events reading backward from a start position', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsBackward(testStream, 2);
		assert.equal(result.events.length, 3);
		assert.equal(result.events[0].data.something, 3);
	});

	it('Should read events reading backward with a count greater than the stream length', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsBackward(testStream, undefined, 10000);
		assert.equal(result.events.length, 10);
		assert.equal(result.events[0].data.something, 10);
	});

	it('Should read events reading forward with a count greater than the stream length return a maximum of 4096', async function () {
		this.timeout(10000);
		const client = new EventStore.HTTPClient(getHttpConfig());

		const testStream = `TestStream-${generateEventId()}`;
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

	it('Should read linked to events and map correctly', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsForward('$ce-TestStream', 0, 1);
		assert.equal(result.events.length, 1);
		assert(result.events[0].data.something);
		assert.equal(0, result.events[0].positionEventNumber);
		assert.equal('$ce-TestStream', result.events[0].positionStreamId);
	});

	it('Should read system and deleted events without resolveLinkTos', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const deletedStream = 'TestStreamDeleted';
		await client.writeEvent(deletedStream, 'TestEventType', { something: 1 });

		await sleep(500);

		const result = await client.readEventsForward('$streams', 0, 4096, false);
		assert(result.events.length > 0, 'More than 0 events expected');
	});

	it('Should read events reading backward with embed type rich', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		const result = await client.readEventsBackward(testStream, 2, undefined, true, 'rich');
		assert.equal(result.events.length, 3);
		assert.equal(result.events[0].data, undefined);
	});

	it('Should read events and set additional meta properties', async () => {
		const client = new EventStore.HTTPClient(getHttpConfig());

		let result = await client.readEventsForward(testStream, 2, 2);
		assert.equal(result.readDirection, 'forward');
		assert.equal(result.fromEventNumber, 2);
		assert.equal(result.nextEventNumber, 4);

		result = await client.readEventsBackward(testStream, 3, 2);
		assert.equal(result.readDirection, 'backward');
		assert.equal(result.fromEventNumber, 3);
		assert.equal(result.nextEventNumber, 1);
	});

	describe('Http Client - Get Events Failure', () => {
		const testStream = `TestStream-${generateEventId()}`;

		it('Should return 404 when stream does not exist', () => {
			const client = new EventStore.HTTPClient(getHttpConfig());

			return client.readEventsForward(testStream).then(() => {
				throw new Error('Should not have received events');
			}).catch(err => {
				assert.equal(404, err.response.status, 'Should have received 404');
			});
		});

		it('Should not return 404 when stream does not exist if ignore 404 is set on config', () => {
			const httpConfigWithIgnore = getHttpConfig();
			httpConfigWithIgnore.ignore = [404];

			const client = new EventStore.HTTPClient(httpConfigWithIgnore);

			return client.readEventsForward(testStream).then(() => {
				throw new Error('Should not have received events');
			}).catch(err => {
				assert.equal(404, err.response.status, 'Should have received 404');
			});
		});
	});
});