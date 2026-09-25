import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('TCP Client - Subscribe To Stream', () => {
  it('Should get all events written to a subscription stream after subscription is started', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let hasPassed = false;
    let dropped = false;

    function onEventAppeared() {
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

    if (dropped) {
      await client.closeAllPools();
      assert.fail('should not drop');
    }

    assert.equal(10, processedEventCount, 'expect processed events to be 10');
    assert(subscription, 'Subscription Expected');
    hasPassed = true;
    await subscription.close();
    await client.close();
  });

  it('Should be able to start multiple subscriptions from single client instance', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());

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
    await sleep(1000);
    await client.writeEvents(testStream, events);
    await waitUntil(() => processedEventCount1 === 10 && processedEventCount2 === 10);

    assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
    assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');

    await sub1.close();
    await sub2.close();
    await client.closeAllPools();
  });

  it('Should await async handlers in order', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const seen = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const onEventAppeared = async (_sub, ev) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      // Later events finish sooner, so an unawaited handler would record them out of order.
      await sleep(50 - ev.data.id * 10);
      seen.push(ev.data.id);
      inFlight -= 1;
    };

    try {
      const sub = await client.subscribeToStream(testStream, onEventAppeared, () => {});
      await sleep(1000);
      const events = [];
      for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
      await client.writeEvents(testStream, events);
      await waitUntil(() => seen.length === 5);

      assert.deepEqual(seen, [0, 1, 2, 3, 4]);
      assert.equal(maxInFlight, 1, 'handlers must not overlap');
      await sub.close();
    } finally {
      await client.closeAllPools();
    }
  });

  it('Should drop the subscription once when an async handler rejects', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
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
        (_sub, reason, error) => drops.push({ reason, error })
      );
      await sleep(1000);
      await client.writeEvent(testStream, 'TestEventType', { id: 1 });
      await waitUntil(() => drops.length >= 1);
      await sleep(300);

      assert.equal(drops.length, 1, 'onDropped must fire once');
      assert.equal(drops[0].reason, 'eventHandlerException');
      assert.equal(drops[0].error, handlerError);
      assert.equal(unhandled.length, 0, 'the rejection must not go unhandled');
    } finally {
      process.off('unhandledRejection', onUnhandled);
      await client.closeAllPools();
    }
  });

  it('Should close only the subscription pool and keep the operations pool', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    try {
      await client.writeEvent(testStream, 'TestEventType', { id: 1 });
      const operationsPool = await client.getPool();
      const subscription = await client.subscribeToStream(
        testStream,
        () => {},
        () => {}
      );
      await subscription.close();

      assert.strictEqual(await client.getPool(), operationsPool, 'the operations pool must survive');
      await client.writeEvent(testStream, 'TestEventType', { id: 2 });
      const events = await client.getEvents(testStream);
      assert.equal(events.length, 2);
    } finally {
      await client.closeAllPools();
    }
  });

  it('Should close a client that only holds live subscriptions without hanging', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const drops = [];

    try {
      await client.subscribeToStream(
        testStream,
        () => {},
        (_sub, reason) => drops.push(reason)
      );
      // No operations pool exists, so close() works on the subscription pool the live subscription holds.
      await client.close();
      await waitUntil(() => drops.length === 1);
    } finally {
      await client.closeAllPools();
    }
  });

  it('Should close each subscription pool on its own when two share a connection name', async function () {
    this.timeout(15 * 1000);
    const config = { ...getTcpConfig(), connectionNameGenerator: () => 'SHARED_SUBSCRIPTION_NAME' };
    const client = new KurrentDB.TCPClient(config);
    const testStream = `TestStream-${generateEventId()}`;
    let receivedByFirst = 0;

    try {
      await client.subscribeToStream(testStream, () => {
        receivedByFirst += 1;
      });
      const second = await client.subscribeToStream(testStream, () => {});
      // Closing the second must not drain the first pool, which would hang on its live connection.
      await second.close();

      await sleep(500);
      await client.writeEvent(testStream, 'TestEventType', { id: 1 });
      await waitUntil(() => receivedByFirst === 1);
    } finally {
      await client.closeAllPools();
    }
  });

  it('Should deliver no queued events after a handler fails', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const drops = [];
    let calls = 0;

    try {
      await client.subscribeToStream(
        testStream,
        async () => {
          calls += 1;
          await sleep(50);
          throw new Error('handler failed');
        },
        (_sub, reason) => drops.push(reason)
      );
      await sleep(1000);
      // Written together, so the rest are already queued when the first handler fails.
      const events = [];
      for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
      await client.writeEvents(testStream, events);
      await waitUntil(() => drops.length === 1);
      await sleep(500);

      assert.equal(calls, 1, 'only the first event reaches the handler');
    } finally {
      await client.closeAllPools();
    }
  });
});
