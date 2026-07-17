import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
import sleep from './utilities/sleep.js';
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
    await sleep(3000);

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
    await sleep(3000);

    assert.equal(10, processedEventCount1, 'Expect processed events to be 10 for subscription 1');
    assert.equal(10, processedEventCount2, 'Expect processed events to be 10 for subscription 2');

    await sub1.close();
    await sub2.close();
    await client.closeAllPools();
  });
});
