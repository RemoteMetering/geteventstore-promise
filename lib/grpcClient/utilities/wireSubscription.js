import { mapEvent, keepEvent } from './mapEvents.js';

// Attaches the mapped data and dropped handlers shared by every subscription flavour.
export const wireHandlers = (subscription, onEventAppeared, onDropped, includeDeleted) => {
  subscription.on('data', (resolvedEvent) => {
    const mappedEvent = mapEvent(resolvedEvent);
    if (keepEvent(mappedEvent, includeDeleted)) onEventAppeared(subscription, mappedEvent);
  });
  if (onDropped) subscription.on('close', (...response) => onDropped(subscription, ...response));
};

// Keep backward compatibility - subscriptions expose close as an alias for unsubscribe.
// Subscriptions ride on the shared per-config client, so closing one only ends
// that subscription and never tears down the connection.
export const overrideClose = (subscription) => {
  subscription.close = () => subscription.unsubscribe();
};

export default (subscription, onEventAppeared, onDropped, includeDeleted) => {
  wireHandlers(subscription, onEventAppeared, onDropped, includeDeleted);
  overrideClose(subscription);
};
