import assert from 'assert';
import KurrentDB from '../lib/index.js';

describe('EventFactory', () => {
  const eventFactory = new KurrentDB.EventFactory();

  it('Should build an event with a generated eventId when none is supplied', () => {
    const event = eventFactory.newEvent('TestEventType', { id: 1 });

    assert.equal(event.eventType, 'TestEventType');
    assert.deepEqual(event.data, { id: 1 });
    assert.equal(typeof event.eventId, 'string');
    assert(event.eventId.length > 0, 'expect a non-empty generated eventId');
  });

  it('Should generate a unique eventId on each call', () => {
    const first = eventFactory.newEvent('TestEventType', { id: 1 });
    const second = eventFactory.newEvent('TestEventType', { id: 2 });

    assert.notEqual(first.eventId, second.eventId);
  });

  it('Should use the supplied eventId when one is provided', () => {
    const eventId = 'fixed-event-id';
    const event = eventFactory.newEvent('TestEventType', { id: 1 }, undefined, eventId);

    assert.equal(event.eventId, eventId);
  });

  it('Should omit metadata when none is provided', () => {
    const event = eventFactory.newEvent('TestEventType', { id: 1 });

    assert.equal('metadata' in event, false);
  });

  it('Should include metadata when provided', () => {
    const metadata = { correlationId: 'abc' };
    const event = eventFactory.newEvent('TestEventType', { id: 1 }, metadata);

    assert.deepEqual(event.metadata, metadata);
  });

  it('Should reject a missing eventType', () => {
    assert.throws(() => eventFactory.newEvent(undefined, { id: 1 }));
  });

  it('Should reject missing data', () => {
    assert.throws(() => eventFactory.newEvent('TestEventType'));
  });
});
