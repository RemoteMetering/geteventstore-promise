import { eventTypeFilter } from '@kurrent/kurrentdb-client';
import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';
// getPersistentSubscriptionToAllInfo and listPersistentSubscriptionsToAll need a server >= 21.10.1,
// so tests that read $all subscription info are skipped on the v21 (21.10.0) image.
import { itUnlessV21 } from './support/v21.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Persistent Subscription to $all', () => {
  it('Should receive events written to $all after the subscription starts', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    // A unique event type lets us count only our events, since $all also carries
    // system events and writes from other tests.
    const eventType = `ToAllType-${generateEventId()}`;
    const groupName = `ToAllGroup-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let hasPassed = false;
    let dropped = false;

    function onEventAppeared(sub, ev) {
      sub.ack(ev);
      if (ev.eventType === eventType) processedEventCount += 1;
    }

    function onDropped() {
      // Ignore the drop that our own close() triggers once the test has passed.
      if (!hasPassed) dropped = true;
    }

    // Start from the current end so we do not replay the whole database.
    await client.createPersistentSubscriptionToAll(groupName, { startFrom: 'end' });
    const subscription = await client.subscribeToPersistentSubscriptionToAll(groupName, onEventAppeared, onDropped);

    const events = [];
    for (let k = 0; k < 10; k++) events.push(eventFactory.newEvent(eventType, { id: k }));

    await sleep(100);
    await client.writeEvents(testStream, events);
    await waitUntil(() => processedEventCount === 10);

    if (dropped) {
      await client.closeAllConnections();
      assert.fail('should not drop');
    }
    assert.equal(processedEventCount, 10, 'expect to process the 10 events written');
    assert(subscription, 'Subscription Expected');

    hasPassed = true;
    await subscription.close();
    await client.persistentSubscriptions.removeToAll(groupName);
    await client.close();
  });

  it('Should only receive filtered events when a filter is supplied', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const eventType = `FilteredType-${generateEventId()}`;
    const groupName = `ToAllFilteredGroup-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;
    const received = [];

    function onEventAppeared(sub, ev) {
      sub.ack(ev);
      received.push(ev.eventType);
    }

    await client.createPersistentSubscriptionToAll(groupName, {
      startFrom: 'end',
      filter: eventTypeFilter({ prefixes: [eventType] })
    });
    const subscription = await client.subscribeToPersistentSubscriptionToAll(groupName, onEventAppeared, () => {});

    await sleep(100);
    await client.writeEvents(testStream, [
      eventFactory.newEvent(eventType, { keep: true }),
      eventFactory.newEvent(`Other-${generateEventId()}`, { keep: false })
    ]);
    await waitUntil(() => received.length > 0);

    await subscription.close();
    await client.persistentSubscriptions.removeToAll(groupName);

    assert(received.length > 0, 'expect at least the matching event');
    assert(
      received.every((t) => t === eventType),
      `expect only ${eventType} events, got ${received.join(', ')}`
    );

    await client.close();
  });

  itUnlessV21('assertToAll should create then update without throwing', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `ToAllAssertGroup-${generateEventId()}`;

    // First call creates, second takes the update path.
    await client.persistentSubscriptions.assertToAll(groupName, { startFrom: 'end' });
    await client.persistentSubscriptions.assertToAll(groupName, { startFrom: 'end', maxRetryCount: 5 });

    const info = await client.persistentSubscriptions.getToAllSubscriptionInfo(groupName);
    assert.equal(info.groupName, groupName);

    await client.persistentSubscriptions.removeToAll(groupName);
    await client.close();
  });

  itUnlessV21('getToAllSubscriptionsInfo should list the created group', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `ToAllListGroup-${generateEventId()}`;

    await client.createPersistentSubscriptionToAll(groupName, { startFrom: 'end' });

    const all = await client.persistentSubscriptions.getToAllSubscriptionsInfo();
    assert(Array.isArray(all), 'expect an array of subscriptions');
    assert(
      all.some((s) => s.groupName === groupName),
      'expect the created group in the list'
    );

    await client.persistentSubscriptions.removeToAll(groupName);
    await client.close();
  });

  itUnlessV21('removeToAll should delete the subscription', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `ToAllRemoveGroup-${generateEventId()}`;

    await client.createPersistentSubscriptionToAll(groupName, { startFrom: 'end' });
    await client.persistentSubscriptions.removeToAll(groupName);

    try {
      await client.persistentSubscriptions.getToAllSubscriptionInfo(groupName);
    } catch (err) {
      assert(err, 'Error expected after removal');
      await client.close();
      return;
    }
    await client.close();
    assert.fail('getToAllSubscriptionInfo should fail after removal');
  });

  it('Subscription should fail when the group does not exist yet', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    try {
      await client.subscribeToPersistentSubscriptionToAll(`NO_GROUP_${generateEventId()}`, () => {});
    } catch (err) {
      assert(/does not exist/.test(err.message), `unexpected error: ${err.message}`);
      return;
    } finally {
      await client.closeAllConnections();
    }

    throw new Error('Should have failed because the subscription does not exist');
  });
});
