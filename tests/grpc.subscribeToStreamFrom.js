import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Subscribe To Stream From', () => {
  it('Should get all events written to a subscription stream', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let liveProcessingStarted = false;
    let hasPassed = false;
    let dropped = false;

    function onEventAppeared() {
      processedEventCount += 1;
    }

    function onLiveProcessingStarted() {
      liveProcessingStarted = true;
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
      const sub = await client.subscribeToStreamFrom(
        testStream,
        0,
        onEventAppeared,
        onLiveProcessingStarted,
        onDropped
      );
      await waitUntil(() => processedEventCount === 10 && liveProcessingStarted);
      assert(!dropped, 'should not drop');
      assert.equal(10, processedEventCount);
      // Newer servers send caughtUp, and 21.10 relies on the stream head fallback. Both must fire.
      assert(liveProcessingStarted, 'expect live processing callback after catching up');
      assert(sub, 'Subscription Expected');
      hasPassed = true;
      await sub.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should get all resolved events read from middle of a linked stream', async function () {
    this.timeout(9 * 1000);

    const client = new KurrentDB.GRPCClient(getGRPCConfig());
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
      const sub = await client.subscribeToStreamFrom(`$ce-TestStream`, 5, onEventAppeared, null, onDropped, settings);
      await waitUntil(() => hasProcessedEvents);
      hasReachAssert = true;
      assert(!dropError, dropError);
      assert(hasProcessedEvents, `Should have processed events`);
      assert(sub, 'Subscription Expected');
      hasPassed = true;
      await sub.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should receive events for a stream created after subscribing', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;

    try {
      const sub = await client.subscribeToStreamFrom(testStream, 0, () => {
        processedEventCount += 1;
      });
      await sleep(100);
      await client.writeEvent(testStream, 'TestEventType', { something: 1 });
      await waitUntil(() => processedEventCount === 1);

      assert.equal(1, processedEventCount, 'expect the event written after subscribing to arrive');
      await sub.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should report live processing once, after the historical events', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const seen = [];
    let liveCalls = 0;

    try {
      const events = [];
      for (let k = 0; k < 5; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
      await client.writeEvents(testStream, events);

      const sub = await client.subscribeToStreamFrom(
        testStream,
        undefined,
        (_sub, ev) => seen.push(ev.data.id),
        () => {
          liveCalls += 1;
          seen.push('live');
        }
      );
      await waitUntil(() => liveCalls === 1);
      await client.writeEvent(testStream, 'TestEventType', { id: 5 });
      await waitUntil(() => seen.includes(5));
      await sleep(200);

      assert.equal(liveCalls, 1, 'onLiveProcessingStarted must fire once');
      assert.deepEqual(seen.slice(0, 6), [0, 1, 2, 3, 4, 'live']);
      await sub.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should report live processing for a stream with no events', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let live = false;

    try {
      const sub = await client.subscribeToStreamFrom(
        testStream,
        undefined,
        () => {},
        () => {
          live = true;
        }
      );
      await waitUntil(() => live);
      await sub.close();
    } finally {
      await client.closeAllConnections();
    }
  });

  it('Should report live processing when starting at the stream head', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    let processedEventCount = 0;
    let live = false;

    try {
      const events = [];
      for (let k = 0; k < 3; k++) events.push(eventFactory.newEvent('TestEventType', { id: k }));
      await client.writeEvents(testStream, events);

      const sub = await client.subscribeToStreamFrom(
        testStream,
        2,
        () => {
          processedEventCount += 1;
        },
        () => {
          live = true;
        }
      );
      await waitUntil(() => live);
      assert.equal(processedEventCount, 0, 'nothing sits after the head revision');
      await sub.close();
    } finally {
      await client.closeAllConnections();
    }
  });
});
