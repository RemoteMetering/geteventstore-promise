import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';
import collect from '../lib/utilities/collect.js';

const eventFactory = new KurrentDB.EventFactory();

const buildEvents = (count) => {
  const events = [];
  for (let k = 0; k < count; k++) {
    events.push(
      eventFactory.newEvent('TestEventType', {
        id: k
      })
    );
  }
  return events;
};

describe('Http Client - Iterate All Stream Events', () => {
  it('Should write events and iterate all stream events', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, buildEvents(1000));

    const allEvents = await collect(client.iterateAllStreamEvents(testStream));
    assert.equal(allEvents.length, 1000);
    assert(allEvents[0].created, 'Created should be defined');
    assert.equal(allEvents[0].data.id, 0);
    assert.equal(allEvents[999].data.id, 999);
  }).timeout(5000);

  it('Should write events and iterate all events from start event', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, buildEvents(1000));

    const allEvents = await collect(client.iterateAllStreamEvents(testStream, 250, 500));
    assert.equal(allEvents.length, 500);
    assert.equal(allEvents[0].data.id, 500);
    assert.equal(allEvents[499].data.id, 999);
  }).timeout(5000);

  it('Should page from a start position passed as a string', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, buildEvents(25));

    // A chunk size of 10 forces paging, which used to concatenate '10' + 10 into '1010'.
    const evs = await collect(client.iterateAllStreamEvents(testStream, 10, '10'));
    assert.deepEqual(
      evs.map((ev) => ev.data.id),
      [...Array(15).keys()].map((k) => k + 10)
    );
  });

  it('Should reject a start position that is not a revision', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    await assert.rejects(collect(client.iterateAllStreamEvents('AnyStream', 10, 'WRONG')), /Start position not valid/);
  });

  it('Should page across multiple chunks and preserve order', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, buildEvents(1000));

    const allEvents = await collect(client.iterateAllStreamEvents(testStream, 100));
    assert.equal(allEvents.length, 1000);
    allEvents.forEach((event, index) => assert.equal(event.data.id, index));
  }).timeout(5000);

  it('Should yield lazily and stop when the consumer stops early', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, buildEvents(1000));

    const firstTen = [];
    for await (const event of client.iterateAllStreamEvents(testStream, 100)) {
      firstTen.push(event);
      if (firstTen.length === 10) break;
    }
    assert.equal(firstTen.length, 10);
    assert.equal(firstTen[0].data.id, 0);
    assert.equal(firstTen[9].data.id, 9);
  }).timeout(5000);

  it('Should iterate stream events with embed type rich', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, buildEvents(1000));

    const allEvents = await collect(client.iterateAllStreamEvents(testStream, 1000, 0, true, 'rich'));
    assert.equal(allEvents.length, 1000);
    assert.equal(allEvents[0].data, undefined);
  }).timeout(5000);
});
