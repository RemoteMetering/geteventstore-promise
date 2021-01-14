import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';

describe('TCP Client - Write Event', () => {
	it('Write to a new stream and read the event', async () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		const events = await client.getEvents(testStream);
		assert.equal(events[0].data.something, '123');
	});

	it('Should fail promise if no event data provided', () => {
		const client = new EventStore.TCPClient(tcpConfig);

		const testStream = `TestStream-${generateEventId()}`;
		return client.writeEvent(testStream, 'TestEventType').then(() => {
			assert.fail('write should not have succeeded');
		}).catch(err => {
			assert(err, 'error should have been returned');
		});
	});
});

describe('TCP Client - Write Event to pre-populated stream', () => {
	let client;
	let testStream;
	beforeEach(async () => {
		client = new EventStore.TCPClient(tcpConfig);
		testStream = `TestStream-${generateEventId()}`;

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
	});

	it('Should fail promise if passed in wrong expectedVersion (covering edge case of expectedVersion=0)', async () => {
		try {
			await client.writeEvent(testStream, 'TestEventType', {
				something: 'abc'
			}, null, {
				expectedVersion: 0
			});
		} catch (err) {
			assert(err, 'Error expected');
			assert(err.message, 'Error Message Expected');
			return;
		}
		assert.fail('Write should not have succeeded');
	});

	it('Should write event if expectedVersion=null', async () => {
		try {
			await client.writeEvent(testStream, 'TestEventType', {
				something: 'abc'
			}, null, {
				expectedVersion: null
			});
		} catch (err) {
			assert.fail('Write should not have failed');
		}
	});
});