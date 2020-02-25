import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import httpConfig from './support/httpConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('Http Client - Get Events', () => {
	const testStream = `TestStream-${generateEventId()}`;
	const numberOfEvents = 10;

	before(() => {
		const client = new EventStore.HTTPClient(httpConfig);

		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}
		return client.writeEvents(testStream, events);
	});

	it('Should get events reading forward', async () => {
		const client = new EventStore.HTTPClient(httpConfig);

		const events = await client.getEvents(testStream, undefined, undefined, 'forward');
		assert.equal(events.length, 10);
		assert(events[0].created, 'Created should be defined');
		assert.equal(events[0].data.something, 1);
	});

	it('Should get events reading backward', async () => {
		const client = new EventStore.HTTPClient(httpConfig);

		const events = await client.getEvents(testStream, 'head', undefined, 'backward');
		assert.equal(events.length, 10);
		assert.equal(events[0].data.something, 10);
	});
});