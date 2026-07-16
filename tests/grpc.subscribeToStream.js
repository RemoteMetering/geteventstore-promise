import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import KurrentDB from '../lib/index.js';
import assert from 'assert';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Subscribe To Stream', () => {
	it('Should get all events written to a subscription stream after subscription is started', async function () {
		this.timeout(15 * 1000);
		const client = new KurrentDB.GRPCClient(getGRPCConfig());
		const testStream = `TestStream-${generateEventId()}`;
		let processedEventCount = 0;
		let hasPassed = false;
		let dropped = false;

		function onEventAppeared() {
			processedEventCount++;
		}

		function onDropped() {
			if (!hasPassed) dropped = true;
		}

		const initialEvents = [];

		for (let k = 0; k < 10; k++) {
			initialEvents.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}

		await client.writeEvents(testStream, initialEvents);
		const subscription = await client.subscribeToStream(testStream, onEventAppeared, onDropped, false);

		const events = [];
		for (let k = 0; k < 10; k++) {
			events.push(eventFactory.newEvent('TestEventType', {
				id: k
			}));
		}
		await sleep(100);
		await client.writeEvents(testStream, events);
		await sleep(3000);

		if (dropped) {
			await client.closeAllConnections();
			assert.fail('should not drop');
		}

		assert.equal(20, processedEventCount, 'expect processed events to be 20');
		assert(subscription, 'Subscription Expected');
		hasPassed = true;
		await subscription.close();
		await client.close();
	});

	it('Should be able to start multiple subscriptions from single client instance', async function () {
		this.timeout(15 * 1000);
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		const testStream = `TestStream-${generateEventId()}`;
		const events = [];
		for (let k = 0; k < 10; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));

		await client.writeEvents(testStream, events);

		let processedEventCount1 = 0;
		let processedEventCount2 = 0;
		const onEv1 = () => processedEventCount1++;
		const onEv2 = () => processedEventCount2++;
		const sub1 = await client.subscribeToStream(testStream, onEv1, () => {});
		const sub2 = await client.subscribeToStream(testStream, onEv2, () => {});
		await sleep(3000);

		assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
		assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');

		await sub1.close();
		await sub2.close();
		await client.closeAllConnections();
	});

	it('Subscription should fail when stream does not exist yet', async function () {
		this.timeout(15 * 1000);
		const client = new KurrentDB.GRPCClient(getGRPCConfig());

		try {
			await client.subscribeToStream(`DOES_NOT_EXISTS_FOR_SUB`, () => {});
		} catch (err) {
			assert.equal(err.message, `Cannot subscribe to stream 'DOES_NOT_EXISTS_FOR_SUB' as it does not exist`);
			return;
		} finally {
			await client.closeAllConnections();
		}

		throw new Error(`Should have failed because stream does not exist`);
	});
});