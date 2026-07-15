import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config, checkStreamExists) => async (
	streamName,
	onEventAppeared,
	onDropped,
	resolveLinkTos = false
) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const streamExists = await checkStreamExists(streamName);
	if (!streamExists) throw new Error(`Cannot subscribe to stream '${streamName}' as it does not exist`);

	const connection = await connectionManager.create(config, true);
	const subscription = await connection.subscribeToStream(streamName, { resolveLinkTos });
	wireSubscription(subscription, connection, config, onEventAppeared, onDropped);

	debug('', 'Subscription: %j', subscription);
	return subscription;
};
