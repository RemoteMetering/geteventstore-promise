import assert from 'assert';
import iterateEventsByType from '../lib/utilities/iterateEventsByType.js';
import collect from '../lib/utilities/collect.js';

const events = [{ eventType: 'OrderPlaced' }, { eventType: 'OrderShipped' }, { eventType: 'O' }];
async function* iterateEvents() {
  yield* events;
}

describe('iterateEventsByType - event type matching', () => {
  const byType = iterateEventsByType(iterateEvents);

  it('Should match a single event type passed as a string', async () => {
    const matched = await collect(byType('AnyStream', 'OrderPlaced'));
    assert.deepEqual(
      matched.map((ev) => ev.eventType),
      ['OrderPlaced']
    );
  });

  it('Should match every type in an array', async () => {
    const matched = await collect(byType('AnyStream', ['OrderPlaced', 'OrderShipped']));
    assert.equal(matched.length, 2);
  });

  it('Should reject event types that are neither a string nor an array', async () => {
    await assert.rejects(collect(byType('AnyStream', { type: 'OrderPlaced' })), /must be an array or a string/);
  });
});
