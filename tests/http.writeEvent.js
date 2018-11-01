import './_globalHooks';

import httpConfig from './support/httpConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

describe('Http Client - Write Event', () => {
	it('Write to a new stream and read the event', async() => {
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		const events = await client.getEvents(testStream);
		assert.equal(events[0].data.something, '123');
	});

	it('Should fail promise if no event data provided', function() {
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		return client.writeEvent(testStream, 'TestEventType').then(() => {
			assert.fail('Write should not have succeeded');
		}).catch(err => {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
		});
	});
});