import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Get All Stream Events', () => {
  it('Should write events and read back all stream events', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = [];
    for (let k = 0; k < 1000; k++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          id: k
        })
      );
    }

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);

    const evs = await client.getAllStreamEvents(testStream);
    assert.equal(evs.length, 1000);
    assert.equal(evs[0].data.id, 0);
    assert.equal(evs[999].data.id, 999);

    await client.close();
  }).timeout(5000);

  it('Should write events and read back all events from start event', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = [];
    for (let k = 0; k < 1000; k++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          id: k
        })
      );
    }

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);

    const evs = await client.getAllStreamEvents(testStream, 250, 500);
    assert.equal(evs.length, 500);
    assert.equal(evs[0].data.id, 500);
    assert.equal(evs[499].data.id, 999);

    await client.close();
  }).timeout(5000);

  it('Should read a stream that does not exist as an empty array rather than throwing', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const evs = await client.getAllStreamEvents(`DoesNotExist-${generateEventId()}`);
    assert.deepEqual(evs, []);

    await client.close();
  });

  it('Should page a linked to stream to completion using the link revision', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const category = `Linked${generateEventId().replace(/-/g, '')}`;
    const written = 30;
    for (let k = 0; k < written; k++) {
      await client.writeEvent(`${category}-${k}`, 'TestEventType', { id: k });
    }

    let evs;
    await waitUntil(
      async () => {
        evs = await client.getAllStreamEvents(`$ce-${category}`, 10);
        return evs.length === written;
      },
      { timeout: 20000 }
    );

    assert.equal(evs.length, written);
    const ids = evs.map((ev) => ev.data.id).sort((a, b) => a - b);
    assert.deepEqual(ids, [...Array(written).keys()], 'every linked event is read exactly once');

    await client.close();
  }).timeout(30000);
});
