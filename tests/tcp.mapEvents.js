import assert from 'assert';
import mapEvents from '../lib/tcpClient/utilities/mapEvents.js';

describe('TCP Client - mapEvents', () => {
  const liveResolvedEvent = {
    event: {
      eventStreamId: 'TestStream',
      eventId: '00000000-0000-0000-0000-000000000001',
      eventNumber: 2,
      eventType: 'TestEventType',
      created: new Date('2020-09-13T12:26:40.000Z'),
      metadata: Buffer.from('{"trace":"abc"}'),
      isJson: true,
      data: Buffer.from('{"something":1}')
    }
  };

  // A resolved-link record whose target is gone arrives with only the link populated.
  const deletedResolvedEvent = {
    link: {
      eventStreamId: '$et-TestEventType',
      eventId: '00000000-0000-0000-0000-000000000002',
      eventNumber: 5,
      eventType: '$>',
      created: new Date('2020-09-13T12:26:40.000Z')
    }
  };

  it('Should map a live event without an isResolved flag', () => {
    const [mapped] = mapEvents([liveResolvedEvent]);
    assert.equal(mapped.isResolved, undefined);
    assert.equal(mapped.eventNumber, 2);
    assert.deepEqual(mapped.data, { something: 1 });
    assert.deepEqual(mapped.metadata, { trace: 'abc' });
  });

  it('Should map a deleted event to an unresolved marker with null payload', () => {
    const [mapped] = mapEvents([deletedResolvedEvent]);
    assert.equal(mapped.isResolved, false);
    assert.equal(mapped.data, null);
    assert.equal(mapped.metadata, null);
    assert.equal(mapped.streamId, '$et-TestEventType');
    assert.equal(mapped.eventNumber, 5);
  });

  it('Should keep deleted events by default and skip them when includeDeleted is false', () => {
    assert.equal(mapEvents([deletedResolvedEvent]).length, 1);
    assert.equal(mapEvents([deletedResolvedEvent], true).length, 1);
    assert.equal(mapEvents([deletedResolvedEvent], false).length, 0);
  });

  it('Should always keep live events even when includeDeleted is false', () => {
    assert.equal(mapEvents([liveResolvedEvent], false).length, 1);
  });
});
