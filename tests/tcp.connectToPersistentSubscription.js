import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import tcpConfig from './support/tcpConfig';
import httpConfig from './support/httpConfig';
import sleep from './utilities/sleep';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Connect to Persistent Subscription', () => {
	const testSubscriptionName = 'TestStreamGroup1';
	let testStream;

	// create persistent susbcription and populate with events
	before(async function () {
		const client = new EventStore.HTTPClient(httpConfig);
		const initialEvents = [];
		testStream = `TestStream-${generateEventId()}`;

		for (let k = 0; k < 10; k++) {
			initialEvents.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		await client.writeEvents(testStream, initialEvents);
		await client.persistentSubscriptions.assert(testSubscriptionName, testStream);
	})

	it('Should get all events written to a subscription stream after subscription is started', function (done) {
		this.timeout(15 * 1000);
		const client = new EventStore.TCPClient(tcpConfig);
		let processedEventCount = 0;
		let hasPassed = false;

		function onEventAppeared() {
			processedEventCount++;
		}

		function onDropped() {
			if (!hasPassed) done('should not drop');
		}

		client.connectToPersistentSubscription(testStream, testSubscriptionName, onEventAppeared, onDropped).then(subscription => sleep(3000).then(() => {
			assert.equal(10, processedEventCount, 'expect processed events to be 10');
			assert(subscription, 'Subscription Expected');
			hasPassed = true;
			done();
			client.close();
		})).catch(done);
	});
});
