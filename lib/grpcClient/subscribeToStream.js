import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config) => async (
	streamName,
	onEventAppeared,
	onDropped,
	resolveLinkTos = false
) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const connection = await connectionManager.getOrCreate(config);
	const subscription = await connection.subscribeToStream(streamName, { resolveLinkTos });
	wireSubscription(subscription, onEventAppeared, onDropped, config.includeDeleted);

	debug('', 'Subscription: %j', subscription);
	return subscription;
};
