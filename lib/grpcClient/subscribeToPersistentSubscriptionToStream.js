import connectionManager from './connectionManager.js';
import { wireHandlers, overrideClose } from './utilities/wireSubscription.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToPersistentSubscriptionStream');
const baseErr = 'Subscribe to Persistent Subscription Stream - ';

export default (config) => async (
	streamName,
	groupName,
	onEventAppeared,
	onDropped,
	settings = {},
	duplexOptions = {}
) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(groupName, `${baseErr}Group Name not provided`);

	const connection = await connectionManager.getOrCreate(config);

	//Not a Promise - subscribeToPersistentSubscriptionToStream returns the subscription stream synchronously.
	//Success/failure only becomes known once a 'confirmation' or 'error' event is emitted.
	const subscription = connection.subscribeToPersistentSubscriptionToStream(streamName, groupName, settings, duplexOptions);

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
				if (err.type === 'persistent-subscription-does-not-exist') return reject(new Error(`Subscription group ${err.groupName} on stream ${err.streamName} does not exist`));
				return reject(err);
			}
			if (onDropped) onDropped(subscription, err);
		});

		subscription.once('confirmation', () => {
			confirmed = true;
			wireHandlers(subscription, onEventAppeared, onDropped);

			debug('', 'Subscription: %j', subscription);
			resolve(subscription);
		});
	});
};
