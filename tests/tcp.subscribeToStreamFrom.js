import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
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
});
