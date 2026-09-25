import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('TCP Client - Subscribe To Stream From', () => {
  it('Should get all events written to a subscription stream', async function () {
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

    const events = [];
    for (let k = 0; k < 10; k++) {
      events.push(eventFactory.newEvent('TestEventType', { id: k }));
    }

    try {
      await client.writeEvents(testStream, events);
      const sub = await client.subscribeToStreamFrom(testStream, 0, onEventAppeared, undefined, onDropped);
      await waitUntil(() => processedEventCount === 10);
      assert(!dropped, 'should not drop');
      assert.equal(10, processedEventCount);
      assert(sub, 'Subscription Expected');
      hasPassed = true;
      await sub.close();
    } finally {
      await client.closeAllPools();
    }
  });

  it('Should get all resolved events read from middle of a linked stream', async function () {
    this.timeout(9 * 1000);

    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let hasProcessedEvents = false;
    let hasPassed = false;
    let hasReachAssert = false;
    let dropError;

    function onEventAppeared(sub, ev) {
      if (ev.isResolved === false) return;
      assert(ev.positionEventId, 'Position link event id expected');
      hasProcessedEvents = true;
    }

    async function onDropped() {
      if (!hasPassed) {
        await client.close();
        if (!hasReachAssert) dropError = 'should not drop during test';
      }
    }

    const events = [];
    for (let k = 0; k < 10; k++) {
      events.push(eventFactory.newEvent('TestEventType', { id: k }));
    }

    try {
      await client.writeEvents(testStream, events);
      const settings = {
        resolveLinkTos: true
      };
      const sub = await client.subscribeToStreamFrom(
        `$ce-TestStream`,
        5,
        onEventAppeared,
        undefined,
        onDropped,
        settings
      );
      await waitUntil(() => hasProcessedEvents);
      hasReachAssert = true;
      assert(!dropError, dropError);
      assert(hasProcessedEvents, `Should have processed events`);
      assert(sub, 'Subscription Expected');
      hasPassed = true;
      await sub.close();
    } finally {
      await client.closeAllPools();
    }
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
      const events = [];
      for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
      await client.writeEvents(testStream, events);
      const sub = await client.subscribeToStreamFrom(testStream, 0, onEventAppeared, undefined, () => {});
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
      await client.writeEvent(testStream, 'TestEventType', { id: 1 });
      await client.subscribeToStreamFrom(
        testStream,
        0,
        async () => {
          throw handlerError;
        },
        undefined,
        (_sub, reason, error) => drops.push({ reason, error })
      );
      await waitUntil(() => drops.length >= 1);
      await sleep(300);

      assert.equal(drops.length, 1, 'onDropped must fire once');
      // node-eventstore-client reports a failure while reading history as catchUpError and a
      // failure on a live event as eventHandlerException.
      assert.ok(['catchUpError', 'eventHandlerException'].includes(drops[0].reason), drops[0].reason);
      assert.equal(drops[0].error, handlerError);
      assert.equal(unhandled.length, 0, 'the rejection must not go unhandled');
    } finally {
      process.off('unhandledRejection', onUnhandled);
      await client.closeAllPools();
    }
  });
});
