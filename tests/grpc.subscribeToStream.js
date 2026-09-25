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
});
