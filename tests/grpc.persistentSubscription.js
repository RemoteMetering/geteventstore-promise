import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';
import { itUnlessV21 } from './support/v21.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Persistent Subscription', () => {
  it('Should get all events written to a persistent subscription stream after subscription is started', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `TestPersistentSubscriptionGroup`;
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let hasPassed = false;
    let dropped = false;

    function onEventAppeared(sub, ev) {
      sub.ack(ev);
      processedEventCount += 1;
    }

    function onDropped() {
      if (!hasPassed) dropped = true;
    }

    const initialEvents = [];

    for (let k = 0; k < 10; k++) {
      initialEvents.push(
        eventFactory.newEvent('TestEventType', {
          id: k
        })
      );
    }

    await client.writeEvents(testStream, initialEvents);
    await client.createPersistentSubscriptionToStream(testStream, groupName);
    const subscription = await client.subscribeToPersistentSubscriptionToStream(
      testStream,
      groupName,
      onEventAppeared,
      onDropped
    );

    const events = [];
    for (let k = 0; k < 10; k++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          id: k
        })
      );
    }
    await sleep(100);
    await client.writeEvents(testStream, events);
    await waitUntil(() => processedEventCount === 20);

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
    const onEv1 = () => {
      processedEventCount1 += 1;
    };
    const onEv2 = () => {
      processedEventCount2 += 1;
    };
    const sub1 = await client.subscribeToPersistentSubscriptionToStream(testStream, groupNameOne, onEv1, () => {});
    const sub2 = await client.subscribeToPersistentSubscriptionToStream(testStream, groupNameTwo, onEv2, () => {});
    await waitUntil(() => processedEventCount1 === 10 && processedEventCount2 === 10);

    assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
    assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');

    await sub1.close();
    await sub2.close();
    await client.closeAllConnections();
  });

  it('Subscription should fail when subscription does not exist yet', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    try {
      await client.subscribeToPersistentSubscriptionToStream(`DOES_NOT_EXISTS_FOR_SUB`, 'NO_GROUP', () => {});
    } catch (err) {
      assert.equal(err.message, `Subscription group NO_GROUP on stream DOES_NOT_EXISTS_FOR_SUB does not exist`);
      return;
    } finally {
      await client.closeAllConnections();
    }

    throw new Error(`Should have failed because subscription does not exist`);
  });

  it('getSubscriptionInfo should return info for a stream subscription', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `InfoGroup-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvents(testStream, [eventFactory.newEvent('TestEventType', { id: 1 })]);
    await client.createPersistentSubscriptionToStream(testStream, groupName);

    const info = await client.persistentSubscriptions.getSubscriptionInfo(groupName, testStream);
    assert.equal(info.groupName, groupName);
    // The gRPC info object names the stream eventSource, unlike the HTTP shape's eventStreamId.
    assert.equal(info.eventSource, testStream);

    await client.persistentSubscriptions.remove(groupName, testStream);
    await client.close();
  });

  it('getStreamSubscriptionsInfo should list subscriptions for a stream', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `StreamInfoGroup-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvents(testStream, [eventFactory.newEvent('TestEventType', { id: 1 })]);
    await client.createPersistentSubscriptionToStream(testStream, groupName);

    const results = await client.persistentSubscriptions.getStreamSubscriptionsInfo(testStream);
    assert(Array.isArray(results), 'expect an array of subscriptions');
    assert(
      results.some((subscription) => subscription.groupName === groupName),
      'expect the created group in the stream subscription list'
    );

    await client.persistentSubscriptions.remove(groupName, testStream);
    await client.close();
  });

  itUnlessV21('getAllSubscriptionsInfo should list the created subscription', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `AllInfoGroup-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvents(testStream, [eventFactory.newEvent('TestEventType', { id: 1 })]);
    await client.createPersistentSubscriptionToStream(testStream, groupName);

    const results = await client.persistentSubscriptions.getAllSubscriptionsInfo();
    assert(Array.isArray(results), 'expect an array of subscriptions');
    assert(
      results.some((subscription) => subscription.groupName === groupName),
      'expect the created group in the full subscription list'
    );

    await client.persistentSubscriptions.remove(groupName, testStream);
    await client.close();
  });
});
