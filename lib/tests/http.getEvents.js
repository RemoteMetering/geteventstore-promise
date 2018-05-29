import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';
import _ from 'lodash';

describe('Http Client - Get Events', () => {
	const testStream = `TestStream-${uuid.v4()}`;
	const numberOfEvents = 10;

	before(() => {
		const client = eventstore.http(httpConfig);

		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				something: i
			}));
		}
		return client.writeEvents(testStream, events);
	});

	it('Should get events reading forward', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, undefined, undefined, 'forward');
		assert.equal(events.length, 10);
		assert(events[0].created, 'Created should be defined');
		assert.equal(events[0].data.something, 1);
	});

	it('Should get events reading backward', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, 'head', undefined, 'backward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
	});

	it('Should get last event reading backward with larger size than events', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, 0, 250, 'backward');
		assert.equal(events.length, 1);
		assert.equal(events[0].data.something, 1);
	});

	it('Should not get any events when start event is greater than the stream length', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, 11);
		assert.equal(events.length, 0);
	});

	it('Should get events reading backward from a start position', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, 2, undefined, 'backward');
		assert.equal(events.length, 3);
		assert.equal(events[0].data.something, 3);
	});

	it('Should get events reading backward with a length greater than the stream length', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, undefined, 10000, 'backward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
	});

	it('Should get events reading forward with a length greater than the stream length return a maximum of 4096', async function () {
		this.timeout(10000);
		const client = eventstore.http(httpConfig);

		const testStream = `TestStream-${uuid.v4()}`;
		const numberOfEvents = 5000;
		const events = [];

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				something: i
			}));
		}

		await client.writeEvents(testStream, events);
		const evs = await client.getEvents(testStream, undefined, 5000);
		assert.equal(evs.length, 4096);
		assert.equal(evs[0].data.something, 1);
		assert.equal(evs[4095].data.something, 4096);
	});

	it('Should get linked to events and map correctly', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents('$ce-TestStream', 0, 1, 'forward');
		assert.equal(events.length, 1);
		assert(events[0].data.something);
		assert.equal(0, events[0].positionEventNumber);
		assert.equal('$ce-TestStream', events[0].positionStreamId);
	});

	it('Should get events reading backward with embed type rich', async () => {
		const client = eventstore.http(httpConfig);

		const events = await client.getEvents(testStream, 2, undefined, 'backward', true, 'rich');
		assert.equal(events.length, 3);
		assert.equal(events[0].data, undefined);
	});

	describe('Http Client - Get Events Failure', () => {
		const testStream = `TestStream-${uuid.v4()}`;

		it('Should return 404 when stream does not exist', () => {
			const client = eventstore.http(httpConfig);

			return client.getEvents(testStream, undefined, undefined, 'forward').then(() => {
				throw new Error('Should not have received events');
			}).catch(err => {
				assert.equal(404, err.statusCode, 'Should have received 404');
			});
		});

		it('Should not return 404 when stream does not exist if ignore 404 is set on config', () => {
			const httpConfigWithIgnore = _.cloneDeep(httpConfig);
			httpConfigWithIgnore.ignore = [404];

			const client = eventstore.http(httpConfigWithIgnore);

			return client.getEvents(testStream, undefined, undefined, 'forward').then(() => {
				throw new Error('Should not have received events');
			}).catch(err => {
				assert.equal(404, err.statusCode, 'Should have received 404');
			});
		});
	});
});