import connectionManager from './connectionManager.js';
import { mapEvent } from './utilities/mapEvents.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:subscribeToPersistentSubscriptionStream');
const baseErr = 'Subscribe to Persistent Subscription Stream - ';

export default (config) => (
	streamName,
	groupName,
	onEventAppeared,
	onDropped,
	settings = {},
	duplexOptions = {}
) => new Promise(async (resolve, reject) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(groupName, `${baseErr}Group Name not provided`);

	const onEvent = (sub, ev) => {
		const mappedEvent = mapEvent(ev);
		if (mappedEvent) onEventAppeared(sub, mappedEvent);
	};

	try {
		const connection = await connectionManager.create(config, true);

		//Not a Promise - subscribeToPersistentSubscriptionToStream returns the subscription stream synchronously.
		//Success/failure only becomes known once a 'confirmation' or 'error' event is emitted.
		const subscription = connection.subscribeToPersistentSubscriptionToStream(streamName, groupName, settings, duplexOptions);

		//Overwrite ack+nack to support event structure
		const originalAck = subscription.ack;
		subscription.ack = async (event) => originalAck.call(subscription, { event: { id: event.eventId } });
		const originalNack = subscription.nack;
		subscription.nack = async (action, reason, event) => originalNack.call(subscription, action, reason, { event: { id: event.eventId } });

		//Keep backward compatibility
		const originalClose = subscription.unsubscribe;
		subscription.close = async function releaseSubConnectionFromPool() {
			await originalClose.call(subscription);
			await connection.releaseConnection();
			await (connectionManager.close(config))(connection.connectionName);
		};
		subscription.unsubscribe = subscription.close;

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
			subscription.on('data', (resolvedEvent) => onEvent(subscription, resolvedEvent));
			if (onDropped) subscription.on('close', (...response) => onDropped(subscription, ...response));

			debug('', 'Subscription: %j', subscription);
			resolve(subscription);
		});
	} catch (ex) {
		reject(ex);
	}
});