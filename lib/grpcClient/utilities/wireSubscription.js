import debugModule from 'debug';
import { mapEvent, keepEvent } from './mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:wireSubscription');

// A subscription reports a clean shutdown through 'close' and a failure through 'error', never
// both, so the handler runs at most once either way.
export const reportOnce = (onDropped) => {
  let reported = false;
  return (subscription, ...response) => {
    if (reported) return;
    reported = true;
    return onDropped(subscription, ...response);
  };
};

// Attaches the mapped data and dropped handlers shared by every subscription flavour.
// Events reach onEventAppeared one at a time and in order. When the handler returns a promise the
// stream pauses until it settles. A handler that throws or rejects drops the subscription through
// onDropped, and so does an event that cannot be mapped.
// onFilteredEvent receives each raw event that includeDeleted filters out. A persistent
// subscription uses it to ack those events, which the caller never sees and so cannot ack.
export const wireHandlers = (subscription, onEventAppeared, onDropped, includeDeleted, onFilteredEvent) => {
  const reportDropped = onDropped && reportOnce(onDropped);

  const failHandler = (err) => {
    debug('', 'Event handler failed, dropping subscription: %s', err?.message);
    if (reportDropped) reportDropped(subscription, err);
    Promise.resolve(subscription.unsubscribe()).catch((unsubscribeErr) =>
      debug('', 'Unsubscribe after handler failure failed: %s', unsubscribeErr?.message)
    );
  };

  subscription.on('data', (resolvedEvent) => {
    let result;
    try {
      const mappedEvent = mapEvent(resolvedEvent);
      if (!keepEvent(mappedEvent, includeDeleted)) {
        if (mappedEvent && onFilteredEvent) result = onFilteredEvent(resolvedEvent);
      } else if (onEventAppeared) {
        result = onEventAppeared(subscription, mappedEvent);
      }
    } catch (err) {
      failHandler(err);
      return;
    }
    if (result && typeof result.then === 'function') {
      subscription.pause();
      result.then(() => subscription.resume(), failHandler);
    }
  });
  if (reportDropped) subscription.on('close', (...response) => reportDropped(subscription, ...response));
  return reportDropped;
};

// Keep backward compatibility - subscriptions expose close as an alias for unsubscribe.
export const overrideClose = (subscription) => {
  subscription.close = () => subscription.unsubscribe();
};

export default (subscription, onEventAppeared, onDropped, includeDeleted) => {
  const reportDropped = wireHandlers(subscription, onEventAppeared, onDropped, includeDeleted);

  subscription.on('error', (err) => {
    debug('', 'Subscription dropped: %s', err.message);
    if (reportDropped) reportDropped(subscription, err);
  });

  overrideClose(subscription);
};
