import './_globalHooks';

import httpConfig from './support/httpConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';

describe('Http Client - Write Events', () => {
	it('Write to a new stream and read the events', async() => {
		const client = eventstore.http(httpConfig);

		const events = [eventstore.eventFactory.NewEvent('TestEventType', {
			something: '456'
		})];

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvents(testStream, events);
		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');
	});

	it('Should not fail promise if no events provided', () => {
		const client = eventstore.http(httpConfig);

		const events = [];

		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvents(testStream, events);
	});

	it('Should fail promise if non array provided', () => {
		const client = eventstore.http(httpConfig);

		const events = {
			something: 'here'
		};

		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvents(testStream, events).then(() => {
			assert.fail('should not have succeeded');
		}).catch(err => {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
		});
	});
});