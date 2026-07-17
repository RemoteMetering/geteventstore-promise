import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import sleep from './utilities/sleep.js';
import KurrentDB, { eventTypeFilter } from '../lib/index.js';
// The 'caughtUp' notification that drives onLiveProcessingStarted needs a server newer than the
// v21 (21.10.0) image, so tests that rely on it are skipped there.
import { itUnlessV21 } from './support/v21.js';

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
    await sleep(3000);

    if (dropped) {
      await client.closeAllConnections();
      assert.fail('should not drop');
    }
    assert.equal(processedEventCount, 10, 'expect to process the 10 events written');

    hasPassed = true;
    await subscription.close();
    await client.close();
  });

  itUnlessV21('Should fire onLiveProcessingStarted once caught up', async function () {
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
    await sleep(3000);

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
    await sleep(3000);

    assert(received.length > 0, 'expect at least the matching event');
    assert(
      received.every((t) => t === eventType),
      `expect only ${eventType} events, got ${received.join(', ')}`
    );

    await subscription.close();
    await client.close();
  });
});
