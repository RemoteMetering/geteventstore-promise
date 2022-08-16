import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config, checkStreamExists) => (
	streamName,
	onEventAppeared,
	onDropped,
	resolveLinkTos = false
) => new Promise(async (resolve, reject) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const onEvent = (sub, ev) => {
		const mappedEvent = mapEvents([ev])[0];
		if (mappedEvent) onEventAppeared(sub, mappedEvent);
	};

	try {
		const streamExists = await checkStreamExists(streamName);
		if (!streamExists) throw new Error(`Cannot subscribe to stream '${streamName}' as it does not exist`);

		const connection = await connectionManager.create(config, true);

		const subscription = await connection.subscribeToStream(streamName, { resolveLinkTos });

		subscription.on('data', (resolvedEvent) => onEvent(subscription, resolvedEvent));
		subscription.on('close', onDropped);

		//Keep backward compatibility
		const originalClose = subscription.unsubscribe;
		subscription.close = async function releaseSubConnectionFromPool() {
			await originalClose.call(subscription);
			await connection.releaseConnection();
			await (connectionManager.close(config))(connection.connectionName);
		};
		subscription.unsubscribe = subscription.close;

		debug('', 'Subscription: %j', subscription);
		resolve(subscription);
	} catch (ex) {
		reject(ex);
	}
});