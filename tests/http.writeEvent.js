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

	it('Should fail promise if no event data provided', async() => {
		const client = new EventStore.HTTPClient(httpConfig);
		const testStream = `TestStream-${uuid.v4()}`;

		try {
			await client.writeEvent(testStream, 'TestEventType');
		}
		catch(err) {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
			return;
		}
		assert.fail('Write should not have succeeded');
	});
});

describe('Http Client - Write Event to pre-populated stream', () => {
	let client;
	let testStream;
	beforeEach(async() => {
		client = new EventStore.HTTPClient(httpConfig);
		testStream = `TestStream-${uuid.v4()}`;

		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		await client.writeEvent(testStream, 'TestEventType', {
			something: '456'
		}, null, {
			expectedVersion: 0
		});

		await client.writeEvent(testStream, 'TestEventType', {
			something: '789'
		}, null, {
			expectedVersion: 1
		});
	})

	it('Should fail promise if passed in wrong expectedVersion (covering edge case of expectedVersion=0)', async() => {
		try {
			await client.writeEvent(testStream, 'TestEventType', {
				something: 'abc'
			}, null, {
				expectedVersion: 0
			});
		}
		catch(err) {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
			return;
		}
		assert.fail('Write should not have succeeded');
	});
	
	it('Should write event if expectedVersion=null', async() => {
		try {
			await client.writeEvent(testStream, 'TestEventType', {
				something: 'abc'
			}, null, {
				expectedVersion: null
			});
		}
		catch(err) {
			assert.fail('Write should not have failed');
			return;
		}
		assert(true, 'Write succeeded');
	});
})