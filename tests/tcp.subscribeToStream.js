import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import tcpConfig from './support/tcpConfig';
import sleep from './utilities/sleep';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Subscribe To Stream', () => {
	it('Should get all events written to a subscription stream after subscription is started', function (done) {
		this.timeout(15 * 1000);
		const client = new EventStore.TCPClient(tcpConfig);
		const testStream = `TestStream-${generateEventId()}`;
		let processedEventCount = 0;
		let hasPassed = false;

		function onEventAppeared() {
			processedEventCount++;
		}

		function onDropped() {
			if (!hasPassed) done('should not drop');
		}

		const initialEvents = [];

		for (let k = 0; k < 10; k++) {
			initialEvents.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		client.writeEvents(testStream, initialEvents).then(() => {
			client.subscribeToStream(testStream, onEventAppeared, onDropped, false).then(subscription => sleep(3000).then(() => {
				assert.equal(10, processedEventCount, 'expect processed events to be 10');
				assert(subscription, 'Subscription Expected');
				hasPassed = true;
				done();
				client.close();
			}));
			const events = [];
			for (let k = 0; k < 10; k++) {
				events.push(eventFactory.newEvent('TestEventType', {
					id: k
				}));
			}
			return sleep(100).then(() => client.writeEvents(testStream, events));
		}).catch(done);
	});

	it('Should be able to start multiple subscriptions from single client instance', async function () {
		this.timeout(15 * 1000);
		const client = new EventStore.TCPClient(tcpConfig);

		const testStream = `TestStream-${generateEventId()}`;
		const events = [];
		for (let k = 0; k < 10; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));

		let processedEventCount1 = 0;
		let processedEventCount2 = 0;
		const onEv1 = () => processedEventCount1++;
		const onEv2 = () => processedEventCount2++;

		await client.subscribeToStream(testStream, onEv1, () => {});
		await client.subscribeToStream(testStream, onEv2, () => {});
		await sleep(1000);
		await client.writeEvents(testStream, events);
		await sleep(3000);

		assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
		assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');
	});
});