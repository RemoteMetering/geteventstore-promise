import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('Http Client - Write Events', () => {
  it('Write to a new stream and read the events', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const events = [
      eventFactory.newEvent('TestEventType', {
        something: '456'
      })
    ];

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvents(testStream, events);
    const evs = await client.getEvents(testStream);
    assert.equal(evs[0].data.something, '456');
  });

  it('Write to a new stream and read the events by type', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

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
  });

  it('Should not fail promise if no events provided', () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const events = [];

    const testStream = `TestStream-${generateEventId()}`;
    return client.writeEvents(testStream, events);
  });

  it('Should fail promise if non array provided', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const events = {
      something: 'here'
    };

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvents(testStream, events);
    } catch (err) {
      assert(err, 'Error expected');
      assert(err.message, 'Error Message Expected');
      return;
    }
    assert.fail('should not have succeeded');
  });
});

describe('Http Client - Write Events to pre-populated stream', () => {
  let client;
  let testStream;
  let events;
  let events2;

  beforeEach(async () => {
    client = new KurrentDB.HTTPClient(getHttpConfig());

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

  it('Should fail promise if passed in wrong expectedVersion (covering edge case of expectedVersion=0)', async () => {
    try {
      await client.writeEvents(testStream, events2, {
        expectedVersion: 0
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
