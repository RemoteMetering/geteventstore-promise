import { wireHandlers, overrideClose } from './wireSubscription.js';

export default (subscription, { onEventAppeared, onDropped, includeDeleted, debug }) => {
	//Overwrite ack+nack to support event structure
	const originalAck = subscription.ack;
	subscription.ack = async (event) => originalAck.call(subscription, { event: { id: event.eventId } });
	const originalNack = subscription.nack;
	subscription.nack = async (action, reason, event) => originalNack.call(subscription, action, reason, { event: { id: event.eventId } });

	overrideClose(subscription);

	return new Promise((resolve, reject) => {
		let confirmed = false;
		subscription.on('error', (err) => {
			if (!confirmed) {
				//The SDK's raw message carries a gRPC status prefix - surface the clean, documented reason instead
				if (err.type === 'persistent-subscription-does-not-exist') {
					const target = err.streamName ? `stream ${err.streamName}` : '$all';
					return reject(new Error(`Subscription group ${err.groupName} on ${target} does not exist`));
				}
				return reject(err);
			}
			if (onDropped) onDropped(subscription, err);
		});

		subscription.once('confirmation', () => {
			confirmed = true;
			wireHandlers(subscription, onEventAppeared, onDropped, includeDeleted);

			if (debug) debug('', 'Subscription: %j', subscription);
			resolve(subscription);
		});
	});
};
