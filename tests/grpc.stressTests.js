import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';
import { itUnlessV21 } from './support/v21.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Stress Tests', () => {
  it('Should handle parallel writes', async function () {
    this.timeout(20000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    const numberOfEvents = 5000;
    const events = [];

    for (let i = 1; i <= numberOfEvents; i++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          something: i
        })
      );
    }

    await Promise.all(events.map((ev) => client.writeEvent(testStream, ev.eventType, ev.data)));
    const evs = await client.getEvents(testStream, undefined, 5000);
    assert.equal(evs.length, 4096);

    await client.close();
  });

  it('Should handle parallel reads and writes', async function () {
    this.timeout(60000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    const numberOfEvents = 5000;
    const events = [];
    let writeCount = 0;
    let readCount = 0;

    for (let i = 1; i <= numberOfEvents; i++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          something: i
        })
      );
    }

    const writes = events.map(async (ev) => {
      await client.writeEvent(testStream, ev.eventType, ev.data);
      writeCount += 1;
    });
    const reads = events.map(async () => {
      await client.getEvents(testStream, undefined, 10);
      readCount += 1;
    });

    await Promise.all([...writes, ...reads]);

    assert.equal(numberOfEvents, writeCount);
    assert.equal(numberOfEvents, readCount);

    await client.close();
  });

  // The 21.10 server's maximum append size is below 50 MiB, so it rejects this append outright.
  itUnlessV21('Writes a batch of 50 events of 1 MiB each in one append', async function () {
    this.timeout(120 * 1000);
    // About 50 MiB takes longer to send than the 10 second default deadline allows on slow machines
    const client = new KurrentDB.GRPCClient({ ...getGRPCConfig(), defaultDeadline: 110 * 1000 });
    const testStream = `TestStream-${generateEventId()}`;

    // One shared 1 MiB string keeps the test's own memory use low
    const payload = 'x'.repeat(1024 * 1024);
    const numberOfEvents = 50;
    const largeEvents = Array.from({ length: numberOfEvents }, (_, i) =>
      eventFactory.newEvent('TestEventType', { index: i, payload })
    );

    // Stays well below the roughly 100 MiB point where the test server's write timeout starts to fail appends
    const result = await client.writeEvents(testStream, largeEvents);
    assert.equal(result.nextExpectedRevision, BigInt(numberOfEvents - 1));

    const evs = await client.getAllStreamEvents(testStream);
    assert.equal(evs.length, numberOfEvents);
    assert.equal(evs[0].data.index, 0);
    assert.equal(evs[numberOfEvents - 1].data.index, numberOfEvents - 1);
    assert.equal(evs[numberOfEvents - 1].data.payload.length, payload.length);

    await client.close();
  });
});
