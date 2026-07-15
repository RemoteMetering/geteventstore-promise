import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStreamFrom');
const baseErr = 'Subscribe to Stream From - ';

export default (config, checkStreamExists) => async (
	streamName,
	fromEventNumber,
	onEventAppeared,
	onDropped,
	settings
) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	settings = settings || {};
	if (!fromEventNumber) fromEventNumber = 'start';

	const streamExists = await checkStreamExists(streamName);
	if (!streamExists) throw new Error(`Cannot subscribe to stream '${streamName}' as it does not exist`);

	const connection = await connectionManager.create(config, true);
	const subscription = await connection.subscribeToStream(streamName, { fromRevision: fromEventNumber, resolveLinkTos: settings.resolveLinkTos });
	wireSubscription(subscription, connection, config, onEventAppeared, onDropped);

	debug('', 'Subscription: %j', subscription);
	return subscription;
};
