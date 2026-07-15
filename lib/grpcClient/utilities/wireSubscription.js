import connectionManager from '../connectionManager.js';
import { mapEvent } from './mapEvents.js';

// Attaches the mapped data and dropped handlers shared by every subscription flavour.
export const wireHandlers = (subscription, onEventAppeared, onDropped) => {
	subscription.on('data', (resolvedEvent) => {
		const mappedEvent = mapEvent(resolvedEvent);
		if (mappedEvent) onEventAppeared(subscription, mappedEvent);
	});
	if (onDropped) subscription.on('close', (...response) => onDropped(subscription, ...response));
};

// Keep backward compatibility - close/unsubscribe also release the subscription's pooled connection.
export const overrideClose = (subscription, connection, config) => {
	const originalClose = subscription.unsubscribe;
	subscription.close = async function releaseSubConnectionFromPool() {
		await originalClose.call(subscription);
		await connection.releaseConnection();
		await (connectionManager.close(config))(connection.connectionName);
	};
	subscription.unsubscribe = subscription.close;
};

export default (subscription, connection, config, onEventAppeared, onDropped) => {
	wireHandlers(subscription, onEventAppeared, onDropped);
	overrideClose(subscription, connection, config);
};
