import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';
import { runningV21 } from './support/v21.js';

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
      await waitUntil(() => processedEventCount === 10 && (runningV21 || liveProcessingStarted));
      assert(!dropped, 'should not drop');
      assert.equal(10, processedEventCount);
      // The 'caughtUp' notification that drives onLiveProcessingStarted needs a server newer
      // than the v21 (21.10.0) image, so only assert it on the current server.
      if (!runningV21) assert(liveProcessingStarted, 'expect live processing callback after catching up');
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
});
