import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Get Events', () => {
  const testStream = `TestStream-${generateEventId()}`;
  const numberOfEvents = 10;

  before(async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = [];

    for (let i = 1; i <= numberOfEvents; i++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          something: i
        })
      );
    }

    await client.writeEvents(testStream, events);

    await client.close();
  });

  it('Should read events reading forward', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward(testStream);
    assert.equal(result.events.length, 10);
    assert.equal(result.events[0].data.something, 1);
    assert.equal('TestEventType', result.events[0].eventType);
    assert(result.events[0].metadata === undefined);
    assert(result.events[0].isJson !== undefined);

    // BigInt handling
    assert.doesNotThrow(() => JSON.stringify(result), 'the read must be JSON serialisable');
    assert.equal(
      new Date(result.events[0].created).getUTCFullYear(),
      new Date().getUTCFullYear(),
      'created is the real write time, not a tick value divided twice'
    );

    await client.close();
  });

  it('Should read events reading backward', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream);
    assert.equal(result.events.length, 10);
    assert.equal(result.events[0].data.something, 10);

    await client.close();
  });

  it('Should read last event reading backward with larger size than events', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, 0, 250);
    assert.equal(result.events.length, 1);
    assert.equal(result.events[0].data.something, 1);

    await client.close();
  });

  it('Should not get any events when start event is greater than the stream length', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward(testStream, 11);
    assert.equal(result.events.length, 0);

    await client.close();
  });

  it('Should read events reading backward from a start position', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, 2);
    assert.equal(result.events.length, 3);
    assert.equal(result.events[0].data.something, 3);

    await client.close();
  });

  it('Should read events reading backward with a count greater than the stream length', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, undefined, 10000);
    assert.equal(result.events.length, 10);
    assert.equal(result.events[0].data.something, 10);

    await client.close();
  });

  it('Should read events reading forward with a count greater than the stream length return a maximum of 4096', async function () {
    this.timeout(40000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const largeStream = `TestStream-${generateEventId()}`;
    const largeStreamEventCount = 5000;
    const events = [];

    for (let i = 1; i <= largeStreamEventCount; i++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          something: i
        })
      );
    }

    await client.writeEvents(largeStream, events);
    const result = await client.readEventsForward(largeStream, undefined, 5000);
    assert.equal(result.events.length, 4096);
    assert.equal(result.events[0].data.something, 1);
    assert.equal(result.events[4095].data.something, 4096);

    await client.close();
  });

  it('Should read linked to events and map correctly', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward('$ce-TestStream', 0, 1);
    assert.equal(result.events.length, 1);
    assert(result.events[0].data.something);
    assert.equal(0, result.events[0].positionEventNumber, 'Position event number should be a number');
    assert.equal('$ce-TestStream', result.events[0].positionStreamId);

    await client.close();
  });

  it('Should report read metadata when the batch is short of the requested count', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward(testStream, 0, 250);
    assert.equal(result.events.length, numberOfEvents);
    assert.equal(result.isEndOfStream, true);
    assert.equal(result.readDirection, 'forward');
    assert.equal(result.fromEventNumber, 0);
    assert.equal(result.nextEventNumber, 0, 'nextEventNumber is 0 once the stream is exhausted');

    await client.close();
  });

  it('Should advance nextEventNumber when the batch fills the requested count', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward(testStream, 0, 4);
    assert.equal(result.events.length, 4);
    assert.equal(result.isEndOfStream, false);
    assert.equal(result.nextEventNumber, 4, 'the cursor sits one past the last event read');

    await client.close();
  });

  it('Should step nextEventNumber down when reading backward', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, 9, 4);
    assert.equal(result.events.length, 4);
    assert.equal(result.isEndOfStream, false);
    assert.equal(result.readDirection, 'backward');
    assert.equal(result.nextEventNumber, 5, 'the cursor sits one below the last event read');

    await client.close();
  });

  it('Should treat a null start position as the start of the stream', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward(testStream, null, 100);
    assert.equal(result.events.length, 10);
    assert.equal(result.events[0].data.something, 1);

    await client.close();
  });

  it('Should treat -1 as the end of the stream on a backward read', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, -1, 2);
    assert.deepEqual(
      result.events.map((ev) => ev.data.something),
      [10, 9]
    );

    await client.close();
  });

  it("Should keep 'end' as the end of the stream on a backward read", async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, 'end', 10);
    assert.equal(result.events.length, 10);
    assert.equal(result.events[0].data.something, 10);

    await client.close();
  });

  it('Should end a full backward batch that reaches the first event', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsBackward(testStream, 9, 10);
    assert.equal(result.events.length, 10);
    assert.equal(result.isEndOfStream, true);
    assert.equal(result.nextEventNumber, 0);

    await client.close();
  });

  it('Should map positionCausedBy and positionCorrelationId from the link metadata', async function () {
    this.timeout(15 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const category = `CausedBy${generateEventId().replace(/-/g, '')}`;
    const categoryStream = `$ce-${category}`;
    const source = eventFactory.newEvent('TestEventType', { something: 1 }, { $correlationId: 'corr-1' });

    try {
      await client.writeEvents(`${category}-1`, [source]);
      // The $by_category projection writes the link asynchronously.
      await waitUntil(async () => (await client.readEventsForward(categoryStream, 0, 1)).events.length === 1);

      const [linked] = (await client.readEventsForward(categoryStream, 0, 1)).events;
      assert.equal(linked.positionStreamId, categoryStream);
      assert.equal(linked.positionCausedBy, source.eventId);
      assert.equal(linked.positionCorrelationId, 'corr-1');
    } finally {
      await client.close();
    }
  });

  // The TCP client reports a never written stream as an empty read, and callers depend on that to
  // bring a brand new aggregate up to date, so gRPC must not surface StreamNotFoundError here.
  it('Should read a stream that does not exist as empty rather than throwing', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward(`DoesNotExist-${generateEventId()}`, 0, 250);
    assert.equal(result.events.length, 0);
    assert.equal(result.isEndOfStream, true);
    assert.equal(result.nextEventNumber, 0);

    await client.close();
  });

  it('Should take nextEventNumber from the link revision on a linked to stream', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readEventsForward('$ce-TestStream', 0, 2);
    assert.equal(result.events.length, 2);
    assert.equal(result.isEndOfStream, false);
    assert.equal(
      result.nextEventNumber,
      result.events[1].positionEventNumber + 1,
      'the cursor follows the position in the stream being read'
    );

    await client.close();
  });

  it('Should read system and deleted events without resolveLinkTos', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const deletedStream = 'TestStreamDeleted';
    await client.writeEvent(deletedStream, 'TestEventType', { something: 1 });

    let result;
    await waitUntil(async () => {
      result = await client.readEventsForward('$streams', 0, 4096, false);
      return result.events.length > 0;
    });
    assert(result.events.length > 0, 'More than 0 events expected');

    await client.close();
  });
});

describe('gRPC Client - Read Events start position validation', () => {
  it('Should reject a start position that is not a revision rather than reading from the start', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    try {
      await assert.rejects(client.readEventsBackward('AnyStream', -5), /'startPosition' not valid/);
      await assert.rejects(client.getEvents('AnyStream', 'abc'), /'startPosition' not valid/);
    } finally {
      await client.close();
    }
  });

  it('Should keep a revision above 2^53 exact instead of rounding it', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvent(testStream, 'TestEventType', { something: 1 });
      const result = await client.readEventsForward(testStream, '9007199254740993', 10);
      assert.equal(result.events.length, 0);
      assert.equal(result.fromEventNumber, 9007199254740993n);
      assert.equal(JSON.parse(JSON.stringify(result)).fromEventNumber, '9007199254740993');
    } finally {
      await client.close();
    }
  });

  it('Should ignore the extra embed argument the HTTP client accepts', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvent(testStream, 'TestEventType', { something: 1 });
      const events = await client.getEvents(testStream, 0, 10, 'forward', true, 'body');
      assert.equal(events.length, 1);
    } finally {
      await client.close();
    }
  });
});
