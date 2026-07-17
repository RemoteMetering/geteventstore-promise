import assert from 'assert';
import { mapEvent, keepEvent } from '../lib/grpcClient/utilities/mapEvents.js';

describe('gRPC Client - mapEvent', () => {
  const liveResolvedEvent = {
    event: {
      streamId: 'TestStream',
      id: '00000000-0000-0000-0000-000000000001',
      revision: 2n,
      type: 'TestEventType',
      created: 16000000000000,
      metadata: '{"trace":"abc"}',
      isJson: true,
      data: { something: 1 }
    }
  };

  // A resolved-link record whose target is gone arrives with only the link populated.
  const deletedResolvedEvent = {
    link: {
      streamId: '$et-TestEventType',
      id: '00000000-0000-0000-0000-000000000002',
      revision: 5n,
      type: '$>',
      created: 16000000000000,
      position: { commit: 42n, prepare: 42n }
    },
    commitPosition: 42n
  };

  it('Should map a live event without an isResolved flag', () => {
    const mapped = mapEvent(liveResolvedEvent);
    assert.equal(mapped.isResolved, undefined);
    assert.equal(mapped.eventNumber, 2);
    assert.equal(mapped.eventType, 'TestEventType');
    assert.deepEqual(mapped.data, { something: 1 });
    assert.deepEqual(mapped.metadata, { trace: 'abc' });
  });

  it('Should map a deleted event to an unresolved marker with null payload', () => {
    const mapped = mapEvent(deletedResolvedEvent);
    assert.equal(mapped.isResolved, false);
    assert.equal(mapped.data, null);
    assert.equal(mapped.metadata, null);
    assert.equal(mapped.streamId, '$et-TestEventType');
    assert.equal(mapped.eventNumber, 5);
    assert.deepEqual(mapped.position, { commit: 42n, prepare: 42n });
  });

  it('Should return null when neither event nor link is present', () => {
    assert.equal(mapEvent({}), null);
  });
});

describe('gRPC Client - keepEvent', () => {
  const live = { eventType: 'TestEventType' };
  const deleted = { isResolved: false };

  it('Should keep live events regardless of includeDeleted', () => {
    assert.equal(keepEvent(live, true), true);
    assert.equal(keepEvent(live, false), true);
    assert.equal(keepEvent(live, undefined), true);
  });

  it('Should keep deleted events unless includeDeleted is explicitly false', () => {
    assert.equal(keepEvent(deleted, undefined), true);
    assert.equal(keepEvent(deleted, true), true);
    assert.equal(keepEvent(deleted, false), false);
  });

  it('Should drop null mappings', () => {
    assert.equal(keepEvent(null, true), false);
  });
});
