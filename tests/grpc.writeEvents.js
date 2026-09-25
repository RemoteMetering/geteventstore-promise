import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Write Events', () => {
  it('Write to a new stream and read the events', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = [
      eventFactory.newEvent('TestEventType', {
        something: '456'
      })
    ];

    const testStream = `TestStream-${generateEventId()}`;
    const result = await client.writeEvents(testStream, events);

    const evs = await client.getEvents(testStream);
    assert.equal(evs[0].data.something, '456');

    // BigInt handling
    assert.equal(typeof result.nextExpectedRevision, 'bigint');
    assert.doesNotThrow(() => JSON.stringify(result), 'the write result must be JSON serialisable');
    assert.equal(JSON.parse(JSON.stringify(result)).nextExpectedRevision, String(result.nextExpectedRevision));

    await client.close();
  });

  it('Write to a new stream and read the event metadata back', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const metadata = { source: 'unit-test', count: 5 };
    const events = [eventFactory.newEvent('TestEventType', { something: '456' }, metadata)];

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);

    const evs = await client.getEvents(testStream);
    assert.deepEqual(evs[0].metadata, metadata);

    await client.close();
  });

  it('Write to a new stream and read the events by type', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = [
      eventFactory.newEvent('TestEventType', {
        something: '456'
      }),
      eventFactory.newEvent('ToBeIgnoredType', {
        something: '789'
      })
    ];

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);

    const evs = await client.getEventsByType(testStream, ['TestEventType']);
    assert.equal(evs.length, 1);
    assert.equal(evs[0].eventType, 'TestEventType');
    assert.equal(evs[0].data.something, '456');

    await client.close();
  });

  it('Should not fail promise if no events provided', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = [];
    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);
  });

  it('Should fail promise if non array provided', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const events = {
      something: 'here'
    };

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvents(testStream, events);
    } catch (err) {
      assert(err, 'error expected');
      return;
    }
    await client.close();
    assert.fail('should not have succeeded');
  });
});

describe('gRPC Client - Write Events atomically in a single append', () => {
  // A small batchAppendSizeInBytes forces the client to send many wire chunks,
  // proving the server still commits them as one unit (the gRPC equivalent of a TCP transaction)
  const eventCount = 5000;
  const batchAppendSizeInBytes = 16 * 1024;
  const newEvents = () =>
    Array.from({ length: eventCount }, (_, i) => eventFactory.newEvent('TestEventType', { index: i }));

  it('Writes thousands of events across many chunks in one append', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;

    const result = await client.writeEvents(testStream, newEvents(), { batchAppendSizeInBytes });
    assert.equal(result.nextExpectedRevision, BigInt(eventCount - 1));

    const evs = await client.getAllStreamEvents(testStream);
    assert.equal(evs.length, eventCount);
    assert.equal(evs[0].data.index, 0);
    assert.equal(evs[eventCount - 1].data.index, eventCount - 1);

    await client.close();
  });

  it('Writes none of the events when the append is rejected', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, [eventFactory.newEvent('TestEventType', { index: -1 })]);

    // The stream sits at revision 0, so expecting revision 5 fails the whole append
    await assert.rejects(client.writeEvents(testStream, newEvents(), { expectedVersion: 5, batchAppendSizeInBytes }));

    const evs = await client.getAllStreamEvents(testStream);
    assert.equal(evs.length, 1);

    await client.close();
  });
});

describe('gRPC Client - Write Events to pre-populated stream', () => {
  let client;
  let testStream;
  let events;
  let events2;

  beforeEach(async () => {
    client = new KurrentDB.GRPCClient(getGRPCConfig());

    events = [
      eventFactory.newEvent('TestEventType', {
        something: '456'
      }),
      eventFactory.newEvent('ToBeIgnoredType', {
        something: '789'
      })
    ];

    testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);

    events2 = [
      eventFactory.newEvent('TestEventType', {
        something: 'abc'
      })
    ];
  });

  afterEach(async () => {
    await client.close();
  });

  it('Should fail promise if passed in wrong expectedVersion (covering edge case of expectedVersion=0)', async () => {
    try {
      await client.writeEvents(testStream, events2, {
        expectedVersion: 'WRONG'
      });
    } catch (err) {
      assert(err, 'Error expected');
      assert(err.message, 'Error Message Expected');
      return;
    }
    assert.fail('Write should not have succeeded');
  });

  it('Should write event if expectedVersion=null', async () => {
    try {
      await client.writeEvents(testStream, events2, {
        expectedVersion: null
      });
    } catch {
      assert.fail('Write should not have failed');
    }
  });
});
