import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - $All Stream Events', () => {
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

  it('Should read events all events', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readAllEvents();
    assert(result.length > 0, `Expected events`);
    await client.close();
  });

  it('Should read events reading forward', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readAllEventsForward();
    assert(result.events.length > 0, `Expected events`);
    await client.close();
  });

  it('Should read events reading backward', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readAllEventsBackward();
    assert(result.events.length > 0, `Expected events`);

    await client.close();
  });

  it('Should not get any events when start event is greater than the stream length', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readAllEventsForward({ commit: 9999999, prepare: 9999999 });
    assert.equal(result.events.length, 0);

    await client.close();
  });

  it('Should read events reading backward with a count greater than the stream length', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const result = await client.readAllEventsBackward(undefined, 99999999);
    assert(result.events.length > 0, `Expected events`);

    await client.close();
  });

  it('Should read events reading forward with a count greater than the stream length return a maximum of 4096', async function () {
    this.timeout(40000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const largeStream = `TestStream-${generateEventId()}`;
    const largeStreamEventCount = 5200;
    const events = [];

    for (let i = 1; i <= largeStreamEventCount; i++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          something: i
        })
      );
    }

    await client.writeEvents(largeStream, events);
    const result = await client.readAllEventsForward(undefined, 5000);
    assert.equal(result.events.length, 4096);

    await client.close();
  });
});
