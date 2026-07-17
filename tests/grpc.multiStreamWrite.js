import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

const describeMultiStreamWrite = process.env.TESTS_V21 === 'true' ? describe.skip : describe;

describeMultiStreamWrite('gRPC Client - Multi Stream Write', () => {
  it('Writes to multiple new streams in one transaction and reads the events back', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const streamA = `TestStream-${generateEventId()}`;
    const streamB = `TestStream-${generateEventId()}`;

    const result = await client.multiStreamWrite([
      {
        streamName: streamA,
        events: [eventFactory.newEvent('TestEventType', { something: 'a1' })]
      },
      {
        streamName: streamB,
        events: [
          eventFactory.newEvent('TestEventType', { something: 'b1' }),
          eventFactory.newEvent('TestEventType', { something: 'b2' })
        ]
      }
    ]);

    assert(result, 'result expected');
    assert.equal(result.responses.length, 2, 'a response per stream expected');
    assert(typeof result.position === 'bigint', 'transaction position expected');

    const eventsA = await client.getEvents(streamA);
    const eventsB = await client.getEvents(streamB);
    assert.equal(eventsA.length, 1);
    assert.equal(eventsA[0].data.something, 'a1');
    assert.equal(eventsB.length, 2);
    assert.equal(eventsB[0].data.something, 'b1');
    assert.equal(eventsB[1].data.something, 'b2');

    await client.close();
  });

  it('Returns the resulting revision for each written stream', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const streamA = `TestStream-${generateEventId()}`;
    const streamB = `TestStream-${generateEventId()}`;

    const result = await client.multiStreamWrite([
      {
        streamName: streamA,
        events: [eventFactory.newEvent('TestEventType', { something: 'a1' })]
      },
      {
        streamName: streamB,
        events: [
          eventFactory.newEvent('TestEventType', { something: 'b1' }),
          eventFactory.newEvent('TestEventType', { something: 'b2' })
        ]
      }
    ]);

    const byStream = Object.fromEntries(result.responses.map((r) => [r.streamName, r.revision]));
    assert.equal(byStream[streamA], 0n, 'single event leaves stream A at revision 0');
    assert.equal(byStream[streamB], 1n, 'two events leave stream B at revision 1');

    await client.close();
  });

  it('Carries string valued event metadata through to each stream', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const streamA = `TestStream-${generateEventId()}`;
    const streamB = `TestStream-${generateEventId()}`;

    await client.multiStreamWrite([
      {
        streamName: streamA,
        events: [eventFactory.newEvent('TestEventType', { something: 'a1' }, { source: 'stream-a' })]
      },
      {
        streamName: streamB,
        events: [eventFactory.newEvent('TestEventType', { something: 'b1' }, { source: 'stream-b' })]
      }
    ]);

    const eventsA = await client.getEvents(streamA);
    const eventsB = await client.getEvents(streamB);
    // The server adds its own $schema.* properties, so assert on the caller keys only
    assert.equal(eventsA[0].metadata.source, 'stream-a');
    assert.equal(eventsB[0].metadata.source, 'stream-b');

    await client.close();
  });

  it('Rejects the transaction when metadata is not string valued', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const streamA = `TestStream-${generateEventId()}`;

    let succeeded = false;
    try {
      await client.multiStreamWrite([
        {
          streamName: streamA,
          events: [eventFactory.newEvent('TestEventType', { something: 'a1' }, { count: 5 })]
        }
      ]);
      succeeded = true;
    } catch (err) {
      assert(err, 'error expected');
    }
    assert(!succeeded, 'Multi stream write should not have succeeded with non string metadata');

    // The stream must never have been created
    assert.equal(await client.checkStreamExists(streamA), false, 'stream A should not exist');

    await client.close();
  });

  it('Is atomic - a failed expectedVersion on one stream writes nothing to any stream', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const streamA = `TestStream-${generateEventId()}`;
    const streamB = `TestStream-${generateEventId()}`;

    // Seed stream A so it sits at revision 0
    await client.writeEvent(streamA, 'TestEventType', { something: 'seed' });

    let succeeded = false;
    try {
      await client.multiStreamWrite([
        {
          streamName: streamA,
          events: [eventFactory.newEvent('TestEventType', { something: 'a-extra' })],
          expectedVersion: 999 // wrong, stream A is at revision 0
        },
        {
          streamName: streamB,
          events: [eventFactory.newEvent('TestEventType', { something: 'b1' })]
        }
      ]);
      succeeded = true;
    } catch (err) {
      assert(err, 'error expected');
    }
    assert(!succeeded, 'Multi stream write should not have succeeded');

    // Stream A must be untouched and stream B must never have been created
    const eventsA = await client.getEvents(streamA);
    assert.equal(eventsA.length, 1, 'stream A should still hold only the seed event');
    assert.equal(await client.checkStreamExists(streamB), false, 'stream B should not exist');

    await client.close();
  });

  it('Resolves without error when no writes are provided', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    // No connection is opened for an empty write, so there is no pool to close afterwards
    await client.multiStreamWrite([]);
  });

  it('Fails the promise when writes is not an array', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    try {
      await client.multiStreamWrite({ streamName: 'nope', events: [] });
    } catch (err) {
      assert(err, 'error expected');
      return;
    }
    await client.close();
    assert.fail('should not have succeeded');
  });

  it('Fails the promise when a write is missing its events array', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const streamA = `TestStream-${generateEventId()}`;

    try {
      await client.multiStreamWrite([{ streamName: streamA }]);
    } catch (err) {
      assert(err, 'error expected');
      return;
    }
    await client.close();
    assert.fail('should not have succeeded');
  });
});
