import assert from 'assert';
import { EventEmitter } from 'events';
import { wireHandlers } from '../lib/grpcClient/utilities/wireSubscription.js';

// A stand-in for the SDK subscription, which is a stream exposing these members.
const fakeSubscription = () => {
  const subscription = new EventEmitter();
  subscription.unsubscribeCalls = 0;
  subscription.pause = () => {};
  subscription.resume = () => {};
  subscription.unsubscribe = async () => {
    subscription.unsubscribeCalls += 1;
  };
  return subscription;
};

const liveEvent = {
  event: { streamId: 'S', id: 'id-1', revision: 0n, type: 'T', created: new Date(), isJson: true, data: {} }
};
const deletedMarker = { link: { streamId: '$et-T', id: 'link-1', revision: 3n, type: '$>', created: new Date() } };

describe('gRPC Client - wireHandlers', () => {
  it('Should drop the subscription when an event cannot be mapped, instead of throwing', () => {
    const subscription = fakeSubscription();
    const drops = [];
    wireHandlers(
      subscription,
      () => {},
      (_sub, err) => drops.push(err)
    );

    // No revision makes the mapping throw inside the 'data' listener.
    assert.doesNotThrow(() => subscription.emit('data', { event: { ...liveEvent.event, revision: undefined } }));
    assert.equal(drops.length, 1);
    assert.equal(subscription.unsubscribeCalls, 1);
  });

  it('Should pass events that includeDeleted filters out to onFilteredEvent', () => {
    const subscription = fakeSubscription();
    const seen = [];
    const filtered = [];
    wireHandlers(
      subscription,
      (_sub, ev) => seen.push(ev.eventId),
      undefined,
      false,
      (resolvedEvent) => filtered.push(resolvedEvent)
    );

    subscription.emit('data', deletedMarker);
    subscription.emit('data', liveEvent);
    assert.deepEqual(seen, ['id-1']);
    assert.deepEqual(filtered, [deletedMarker]);
  });

  it('Should not call onFilteredEvent when deleted events are kept', () => {
    const subscription = fakeSubscription();
    const filtered = [];
    wireHandlers(
      subscription,
      () => {},
      undefined,
      true,
      (resolvedEvent) => filtered.push(resolvedEvent)
    );

    subscription.emit('data', deletedMarker);
    assert.deepEqual(filtered, []);
  });
});
