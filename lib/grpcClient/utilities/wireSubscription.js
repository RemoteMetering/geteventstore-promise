import debugModule from 'debug';
import { mapEvent, keepEvent } from './mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:wireSubscription');

// Attaches the mapped data and dropped handlers shared by every subscription flavour.
export const wireHandlers = (subscription, onEventAppeared, onDropped, includeDeleted) => {
  subscription.on('data', (resolvedEvent) => {
    const mappedEvent = mapEvent(resolvedEvent);
    if (keepEvent(mappedEvent, includeDeleted)) onEventAppeared(subscription, mappedEvent);
  });
  if (onDropped) subscription.on('close', (...response) => onDropped(subscription, ...response));
};

// Keep backward compatibility - subscriptions expose close as an alias for unsubscribe.
export const overrideClose = (subscription) => {
  subscription.close = () => subscription.unsubscribe();
};

// A subscription reports a clean shutdown through 'close' and a failure through 'error', never
// both, so the handler runs at most once either way.
const reportOnce = (onDropped) => {
  let reported = false;
  return (subscription, ...response) => {
    if (reported) return;
    reported = true;
    return onDropped(subscription, ...response);
  };
};

export default (subscription, onEventAppeared, onDropped, includeDeleted) => {
  const reportDropped = onDropped && reportOnce(onDropped);

  wireHandlers(subscription, onEventAppeared, reportDropped, includeDeleted);

  subscription.on('error', (err) => {
    debug('', 'Subscription dropped: %s', err.message);
    if (reportDropped) reportDropped(subscription, err);
  });

  overrideClose(subscription);
};
