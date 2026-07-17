import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import KurrentDB, { eventTypeFilter } from '../lib/index.js';
import { itUnlessV21 } from './support/v21.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Replay parked messages', () => {
  it('replayParkedMessagesToStream should redeliver parked messages', async function () {
    this.timeout(30 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `ReplayStreamGroup-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;

    const parked = new Set();
    let redelivered = 0;
    let replayed = false;

    function onEventAppeared(sub, ev) {
      if (!replayed) {
        // First pass: park every message.
        parked.add(ev.eventId);
        sub.nack('park', 'testing replay', ev);
      } else {
        // After replay: ack the redelivered messages.
        if (parked.has(ev.eventId)) redelivered += 1;
        sub.ack(ev);
      }
    }

    const events = [];
    for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
    await client.writeEvents(testStream, events);

    await client.createPersistentSubscriptionToStream(testStream, groupName);
    const subscription = await client.subscribeToPersistentSubscriptionToStream(
      testStream,
      groupName,
      onEventAppeared,
      () => {}
    );

    await sleep(4000);
    assert.equal(parked.size, 5, 'expect all 5 messages to have been parked');

    replayed = true;
    await client.persistentSubscriptions.replayParkedMessagesToStream(groupName, testStream);
    await sleep(4000);

    assert(redelivered > 0, 'expect parked messages to be redelivered after replay');

    await subscription.close();
    await client.persistentSubscriptions.remove(groupName, testStream);
    await client.close();
  });

  itUnlessV21('replayParkedMessagesToAll should redeliver parked messages', async function () {
    this.timeout(30 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const groupName = `ReplayAllGroup-${generateEventId()}`;
    const eventType = `ReplayAllType-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;

    const parked = new Set();
    let redelivered = 0;
    let replayed = false;

    function onEventAppeared(sub, ev) {
      if (!replayed) {
        parked.add(ev.eventId);
        sub.nack('park', 'testing replay', ev);
      } else {
        if (parked.has(ev.eventId)) redelivered += 1;
        sub.ack(ev);
      }
    }

    // Start from the end and filter to our unique type so only our events are delivered.
    await client.createPersistentSubscriptionToAll(groupName, {
      startFrom: 'end',
      filter: eventTypeFilter({ prefixes: [eventType] })
    });
    const subscription = await client.subscribeToPersistentSubscriptionToAll(groupName, onEventAppeared, () => {});

    const events = [];
    for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent(eventType, { id: k }));
    await sleep(100);
    await client.writeEvents(testStream, events);

    await sleep(4000);
    assert.equal(parked.size, 5, 'expect all 5 messages to have been parked');

    replayed = true;
    await client.persistentSubscriptions.replayParkedMessagesToAll(groupName);
    await sleep(4000);

    assert(redelivered > 0, 'expect parked messages to be redelivered after replay');

    await subscription.close();
    await client.persistentSubscriptions.removeToAll(groupName);
    await client.close();
  });
});
