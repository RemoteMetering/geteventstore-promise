import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import EventStore from '../lib/index.js';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('gRPC Client - Persistent Subscription', () => {
	it('Should get all events written to a persistent subscription stream after subscription is started', function (done) {
		this.timeout(15 * 1000);
		const client = new EventStore.GRPCClient(getGRPCConfig());
		const groupName = `TestPersistentSubscriptionGroup`;
		const testStream = `TestStream-${generateEventId()}`;
		let processedEventCount = 0;
		let hasPassed = false;

		function onEventAppeared(sub, ev) {
			sub.ack(ev);
			processedEventCount++;
		}

		async function onDropped() {
			if (!hasPassed) {
				await client.closeAllPools();
				done('should not drop');
			}
		}

		const initialEvents = [];

		for (let k = 0; k < 10; k++) {
			initialEvents.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		client.writeEvents(testStream, initialEvents).then(() => {
			client.createPersistentSubscriptionToStream(testStream, groupName).then(() => {
				client.subscribeToPersistentSubscriptionToStream(testStream, groupName, onEventAppeared, onDropped).then(subscription => sleep(3000).then(async () => {
					assert.equal(20, processedEventCount, 'expect processed events to be 20');
					assert(subscription, 'Subscription Expected');
					hasPassed = true;
					await subscription.close();
					await client.close();
					done();
				}));
			});
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
		const client = new EventStore.GRPCClient(getGRPCConfig());

		const groupNameOne = `TestPersistentSubscriptionGroupOne`;
		const groupNameTwo = `TestPersistentSubscriptionGroupTwo`;
		const testStream = `TestStream-${generateEventId()}`;
		const events = [];
		for (let k = 0; k < 10; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));

		await client.writeEvents(testStream, events);

		await client.createPersistentSubscriptionToStream(testStream, groupNameOne);
		await client.createPersistentSubscriptionToStream(testStream, groupNameTwo);

		let processedEventCount1 = 0;
		let processedEventCount2 = 0;
		const onEv1 = () => processedEventCount1++;
		const onEv2 = () => processedEventCount2++;
		const sub1 = await client.subscribeToPersistentSubscriptionToStream(testStream, groupNameOne, onEv1, () => {});
		const sub2 = await client.subscribeToPersistentSubscriptionToStream(testStream, groupNameTwo, onEv2, () => {});
		await sleep(3000);

		assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
		assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');

		await sub1.close();
		await sub2.close();
		await client.closeAllPools();
	});

	it('Subscription should fail when subscription does not exist yet', async function () {
		this.timeout(15 * 1000);
		const client = new EventStore.GRPCClient(getGRPCConfig());

		try {
			await client.subscribeToPersistentSubscriptionToStream(`DOES_NOT_EXISTS_FOR_SUB`, 'NO_GROUP', () => {});
		} catch (err) {
			assert.equal(err.message, `Subscription group NO_GROUP on stream DOES_NOT_EXISTS_FOR_SUB does not exist`);
			return;
		} finally {
			await client.closeAllPools();
		}

		throw new Error(`Should have failed because subscription does not exist`);
	});
});