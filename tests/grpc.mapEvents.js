import assert from 'assert';
import { mapEvent, keepEvent, toCreated } from '../lib/grpcClient/utilities/mapEvents.js';

describe('gRPC Client - mapEvent', () => {
  // The SDK hands the record over with created already converted from .NET ticks to a Date.
  const created = new Date('2020-09-13T12:26:40.000Z');

  const liveResolvedEvent = {
    event: {
      streamId: 'TestStream',
      id: '00000000-0000-0000-0000-000000000001',
      revision: 2n,
      type: 'TestEventType',
      created,
      metadata: '{"trace":"abc"}',
      isJson: true,
      data: { something: 1 },
      position: { commit: 42n, prepare: 42n }
    }
  };

  // A resolved-link record whose target is gone arrives with only the link populated.
  const deletedResolvedEvent = {
    link: {
      streamId: '$et-TestEventType',
      id: '00000000-0000-0000-0000-000000000002',
      revision: 5n,
      type: '$>',
      created,
      position: { commit: 42n, prepare: 42n }
    },
    commitPosition: 42n
  };

  // A live event read through a projection stream, so both event and link are populated.
  const linkedResolvedEvent = { ...liveResolvedEvent, link: deletedResolvedEvent.link, commitPosition: 42n };

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

  it('Should narrow revisions to Number rather than leaving them BigInt', () => {
    const live = mapEvent(liveResolvedEvent);
    assert.equal(typeof live.eventNumber, 'number');

    const deleted = mapEvent(deletedResolvedEvent);
    assert.equal(typeof deleted.eventNumber, 'number');

    const linked = mapEvent(linkedResolvedEvent);
    assert.equal(typeof linked.positionEventNumber, 'number');
    assert.equal(linked.positionEventNumber, 5);
  });

  it('Should decode a non JSON payload to a string, as the HTTP and TCP clients do', () => {
    const linkBody = '0@TestStream';
    const mapped = mapEvent({
      event: {
        streamId: '$streams',
        id: '00000000-0000-0000-0000-000000000003',
        revision: 0n,
        type: '$>',
        created,
        isJson: false,
        data: new Uint8Array(Buffer.from(linkBody))
      }
    });

    assert.equal(mapped.data, linkBody);
    assert.equal(mapped.data.split('@')[1], 'TestStream');
  });

  it('Should leave a JSON payload untouched, including one that is itself an array', () => {
    const mapped = mapEvent({
      event: {
        streamId: 'TestStream',
        id: '00000000-0000-0000-0000-000000000004',
        revision: 0n,
        type: 'TestEventType',
        created,
        isJson: true,
        data: [1, 2, 3]
      }
    });

    assert.deepEqual(mapped.data, [1, 2, 3]);
  });

  // The SDK already converted the .NET ticks, so dividing again put every created in 1970.
  it('Should use the created Date the SDK supplies rather than dividing it again', () => {
    assert.equal(mapEvent(liveResolvedEvent).created, '2020-09-13T12:26:40.000Z');
    assert.equal(mapEvent(deletedResolvedEvent).created, '2020-09-13T12:26:40.000Z');
    assert.equal(mapEvent(linkedResolvedEvent).positionCreated, '2020-09-13T12:26:40.000Z');
  });

  it('Should accept a raw tick value for created, as a number or a BigInt', () => {
    assert.equal(toCreated(16000000000000), toCreated(16000000000000n));
    assert.equal(toCreated(null), undefined);
    assert.equal(toCreated(undefined), undefined);
  });

  it('Should keep position and commitPosition as BigInt on the event itself', () => {
    const mapped = mapEvent(linkedResolvedEvent);
    assert.equal(typeof mapped.commitPosition, 'bigint');
    assert.equal(typeof mapped.position.commit, 'bigint');
    assert.equal(typeof mapped.position.prepare, 'bigint');
  });

  // BigInt handling
  it('Should serialise a linked event, narrowing its BigInts to decimal strings', () => {
    const mapped = mapEvent(linkedResolvedEvent);
    const plain = JSON.parse(JSON.stringify(mapped));

    assert.equal(plain.commitPosition, '42');
    assert.deepEqual(plain.position, { commit: '42', prepare: '42' });
    assert.equal(BigInt(plain.commitPosition), mapped.commitPosition, 'the string round-trips back to the BigInt');
  });

  it('Should serialise a deleted event and an array of events', () => {
    assert.doesNotThrow(() => JSON.stringify(mapEvent(deletedResolvedEvent)));
    assert.doesNotThrow(() => JSON.stringify([mapEvent(linkedResolvedEvent), mapEvent(deletedResolvedEvent)]));
  });

  it('Should serialise a position on its own, not only as part of an event', () => {
    const mapped = mapEvent(deletedResolvedEvent);
    assert.equal(JSON.stringify(mapped.position), '{"commit":"42","prepare":"42"}');
  });

  it('Should keep toJSON off the enumerable keys so the event shape is unchanged', () => {
    const mapped = mapEvent(linkedResolvedEvent);
    assert.equal(Object.keys(mapped).includes('toJSON'), false);
    assert.equal(JSON.stringify(Object.keys(mapped)).includes('toJSON'), false);
  });

  it('Should keep metadata that the SDK decoded to a plain JSON string literal', () => {
    const mapped = mapEvent({ event: { ...liveResolvedEvent.event, metadata: 'hello' } });
    assert.equal(mapped.metadata, 'hello');
  });

  it('Should still decode JSON text stored inside a metadata string', () => {
    const mapped = mapEvent(liveResolvedEvent);
    assert.deepEqual(mapped.metadata, { trace: 'abc' });
  });

  it('Should share one toJSON function across mapped events', () => {
    const first = mapEvent(liveResolvedEvent);
    const second = mapEvent(liveResolvedEvent);
    assert.strictEqual(first.toJSON, second.toJSON);
    assert.equal(JSON.parse(JSON.stringify(second)).position.commit, '42');
  });
  it('Should keep commitPosition off a spread copy so the copy still serialises', () => {
    const mapped = mapEvent({ ...liveResolvedEvent, commitPosition: 42n });
    assert.equal(mapped.commitPosition, 42n);
    assert.equal(JSON.parse(JSON.stringify(mapped)).commitPosition, '42');

    const copy = { ...mapped, receivedAt: 'now' };
    assert.equal('commitPosition' in copy, false);
    // position keeps its own toJSON through the copy, so the whole copy serialises.
    assert.equal(JSON.parse(JSON.stringify(copy)).position.commit, '42');
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
