import { wireHandlers, overrideClose, reportOnce } from './wireSubscription.js';

export default (subscription, { onEventAppeared, onDropped, includeDeleted, debug }) => {
  // Overwrite ack+nack to accept mapped events. The server tracks a resolved link by the link's id,
  // so positionEventId wins over eventId, matching the SDK's own link?.id ?? event?.id order.
  const toResolved = (event) => ({ event: { id: event.positionEventId ?? event.eventId } });
  const originalAck = subscription.ack;
  subscription.ack = async (...events) => originalAck.call(subscription, ...events.map(toResolved));
  const originalNack = subscription.nack;
  subscription.nack = async (action, reason, ...events) =>
    originalNack.call(subscription, action, reason, ...events.map(toResolved));

  overrideClose(subscription);

  const reportDropped = onDropped && reportOnce(onDropped);

  return new Promise((resolve, reject) => {
    let confirmed = false;
    subscription.once('close', () => {
      if (!confirmed) reject(new Error('Persistent subscription closed before it was confirmed'));
    });
    subscription.on('error', (err) => {
      if (!confirmed) {
        // The SDK's raw message carries a gRPC status prefix - surface the clean, documented reason instead
        if (err.type === 'persistent-subscription-does-not-exist') {
          const target = err.streamName ? `stream ${err.streamName}` : '$all';
          reject(new Error(`Subscription group ${err.groupName} on ${target} does not exist`));
          return;
        }
        reject(err);
        return;
      }
      if (reportDropped) reportDropped(subscription, err);
    });

    subscription.once('confirmation', () => {
      confirmed = true;
      wireHandlers(subscription, onEventAppeared, reportDropped, includeDeleted);

      if (debug) debug('', 'Subscription: %j', subscription);
      resolve(subscription);
    });
  });
};
