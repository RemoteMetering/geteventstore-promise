import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB, { eventTypeFilter } from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Subscribe to $all', () => {
  it('Should receive events written to $all after the subscription starts', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const eventType = `SubAllType-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let hasPassed = false;
    let dropped = false;

    function onEventAppeared(sub, ev) {
      if (ev.eventType === eventType) processedEventCount += 1;
    }

    function onDropped() {
      if (!hasPassed) dropped = true;
    }

    // Start from the end so we do not replay the whole database.
    const subscription = await client.subscribeToAll('end', onEventAppeared, undefined, onDropped);

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

    hasPassed = true;
    await subscription.close();
    await client.close();
  });

  it('Should fire onLiveProcessingStarted once caught up', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    let live = false;

    const subscription = await client.subscribeToAll(
      'end',
      () => {},
      () => {
        live = true;
      },
      () => {}
    );
    await waitUntil(() => live);

    assert(live, 'expect onLiveProcessingStarted to have fired');

    await subscription.close();
    await client.close();
  });

  it('Should only receive filtered events when a filter is supplied', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const eventType = `SubAllFilteredType-${generateEventId()}`;
    const testStream = `TestStream-${generateEventId()}`;
    const received = [];

    function onEventAppeared(sub, ev) {
      received.push(ev.eventType);
    }

    const subscription = await client.subscribeToAll('end', onEventAppeared, undefined, () => {}, {
      filter: eventTypeFilter({ prefixes: [eventType] })
    });

    await sleep(100);
    await client.writeEvents(testStream, [
      eventFactory.newEvent(eventType, { keep: true }),
      eventFactory.newEvent(`Other-${generateEventId()}`, { keep: false })
    ]);
    await waitUntil(() => received.length > 0);

    assert(received.length > 0, 'expect at least the matching event');
    assert(
      received.every((t) => t === eventType),
      `expect only ${eventType} events, got ${received.join(', ')}`
    );

    await subscription.close();
    await client.close();
  });

  // Newer servers send caughtUp, and 21.10 relies on the $all head fallback. Both must fire, and
  // only after the handler has worked through the catch-up events.
  it('Should report live processing after catching up from a position', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const eventType = `SubAllLiveType-${generateEventId()}`;
    const seen = [];

    try {
      const [before] = (await client.readAllEventsBackward(undefined, 1)).events;
      const events = [];
      for (let k = 0; k < 3; k++) events.push(eventFactory.newEvent(eventType, { id: k }));
      await client.writeEvents(`TestStream-${generateEventId()}`, events);

      const subscription = await client.subscribeToAll(
        before.position,
        async (_sub, ev) => {
          if (ev.eventType !== eventType) return;
          await sleep(20);
          seen.push(ev.data.id);
        },
        () => seen.push('live'),
        () => {}
      );
      await waitUntil(() => seen.includes('live'));

      assert.deepEqual(seen.slice(0, 4), [0, 1, 2, 'live']);
      await subscription.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should report live processing on a filtered subscription from a position', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const eventType = `SubAllFilteredLiveType-${generateEventId()}`;
    const seen = [];

    try {
      const [before] = (await client.readAllEventsBackward(undefined, 1)).events;
      const events = [];
      for (let k = 0; k < 3; k++) events.push(eventFactory.newEvent(eventType, { id: k }));
      await client.writeEvents(`TestStream-${generateEventId()}`, events);

      const filter = eventTypeFilter({ prefixes: [eventType] });
      // A caller hook must keep working alongside the checkpoint the fallback listens to.
      filter.checkpointReached = () => {};
      const subscription = await client.subscribeToAll(
        before.position,
        (_sub, ev) => seen.push(ev.data.id),
        () => seen.push('live'),
        () => {},
        { filter }
      );
      await waitUntil(() => seen.includes('live'), { timeout: 15000 });

      assert.deepEqual(seen.slice(0, 4), [0, 1, 2, 'live']);
      await subscription.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should treat a null start position and null settings as defaults', async function () {
    this.timeout(20 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    try {
      const subscription = await client.subscribeToAll(
        null,
        () => {},
        undefined,
        () => {},
        null
      );
      assert(subscription, 'Subscription Expected');
      await subscription.close();
    } finally {
      await client.closeAllConnections();
    }
  });
});
