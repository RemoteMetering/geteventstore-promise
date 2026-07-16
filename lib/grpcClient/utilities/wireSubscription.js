import { mapEvent } from './mapEvents.js';

// Attaches the mapped data and dropped handlers shared by every subscription flavour.
export const wireHandlers = (subscription, onEventAppeared, onDropped) => {
	subscription.on('data', (resolvedEvent) => {
		const mappedEvent = mapEvent(resolvedEvent);
		if (mappedEvent) onEventAppeared(subscription, mappedEvent);
	});
	if (onDropped) subscription.on('close', (...response) => onDropped(subscription, ...response));
};

// Keep backward compatibility - subscriptions expose close as an alias for unsubscribe.
// Subscriptions ride on the shared per-config client, so closing one only ends
// that subscription and never tears down the connection.
export const overrideClose = (subscription) => {
	subscription.close = () => subscription.unsubscribe();
};

export default (subscription, onEventAppeared, onDropped) => {
	wireHandlers(subscription, onEventAppeared, onDropped);
	overrideClose(subscription);
};
