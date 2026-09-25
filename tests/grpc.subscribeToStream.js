import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Subscribe To Stream', () => {
  it('Should get all events written to a subscription stream after subscription is started', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let hasPassed = false;
    let dropped = false;

    let serialisationError;

    function onEventAppeared(_subscription, event) {
      processedEventCount += 1;
      // BigInt handling - Assert
      try {
        JSON.stringify(event);
      } catch (err) {
        serialisationError = err;
      }
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
    const subscription = await client.subscribeToStream(testStream, onEventAppeared, onDropped, false);

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
    await waitUntil(() => processedEventCount === 10);
    // Give any replayed history time to arrive, so a regression shows up as an over-count.
    await sleep(500);

    if (dropped) {
      await client.closeAllConnections();
      assert.fail('should not drop');
    }

    assert.equal(10, processedEventCount, 'expect only the 10 events written after subscribing');
    assert(subscription, 'Subscription Expected');
    // BigInt handling
    assert.equal(serialisationError, undefined, 'every delivered event must be JSON serialisable');
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

    let processedEventCount1 = 0;
    let processedEventCount2 = 0;
    const onEv1 = () => {
      processedEventCount1 += 1;
    };
    const onEv2 = () => {
      processedEventCount2 += 1;
    };
    const sub1 = await client.subscribeToStream(testStream, onEv1, () => {});
    const sub2 = await client.subscribeToStream(testStream, onEv2, () => {});
    await sleep(100);
    await client.writeEvents(testStream, events);
    await waitUntil(() => processedEventCount1 === 10 && processedEventCount2 === 10);

    assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
    assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');

    await sub1.close();
    await sub2.close();
    await client.closeAllConnections();
  });

  it('Should receive events for a stream created after subscribing', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;

    try {
      const subscription = await client.subscribeToStream(testStream, () => {
        processedEventCount += 1;
      });
      await sleep(100);
      await client.writeEvent(testStream, 'TestEventType', { something: 1 });
      await waitUntil(() => processedEventCount === 1);

      assert.equal(1, processedEventCount, 'expect the event written after subscribing to arrive');
      await subscription.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should await async handlers in order', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const seen = [];
    let inFlight = 0;
    let maxInFlight = 0;

    try {
      const subscription = await client.subscribeToStream(testStream, async (_sub, ev) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        // Later events finish sooner, so an unawaited handler would record them out of order.
        await sleep(50 - ev.data.id * 10);
        seen.push(ev.data.id);
        inFlight -= 1;
      });
      await sleep(100);
      const events = [];
      for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
      await client.writeEvents(testStream, events);
      await waitUntil(() => seen.length === 5);

      assert.deepEqual(seen, [0, 1, 2, 3, 4]);
      assert.equal(maxInFlight, 1, 'handlers must not overlap');
      await subscription.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should drop the subscription when an async handler rejects', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const handlerError = new Error('handler failed');
    const drops = [];
    const unhandled = [];
    const onUnhandled = (reason) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    try {
      await client.subscribeToStream(
        testStream,
        async () => {
          throw handlerError;
        },
        (_sub, err) => drops.push(err)
      );
      await sleep(100);
      await client.writeEvent(testStream, 'TestEventType', { id: 1 });
      await waitUntil(() => drops.length === 1);
      await sleep(200);

      assert.equal(drops.length, 1, 'onDropped must fire once');
      assert.equal(drops[0], handlerError);
      assert.equal(unhandled.length, 0, 'the rejection must not go unhandled');
    } finally {
      process.off('unhandledRejection', onUnhandled);
      await client.closeAllConnections();
    }
  });

  it('Should not throw when onEventAppeared is omitted', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const drops = [];

    try {
      const subscription = await client.subscribeToStream(testStream, undefined, (_sub, err) => drops.push(err));
      await sleep(100);
      await client.writeEvent(testStream, 'TestEventType', { id: 1 });
      await sleep(300);

      assert.equal(drops.length, 0);
      await subscription.close();
    } finally {
      await client.closeAllConnections();
    }
  });
});
