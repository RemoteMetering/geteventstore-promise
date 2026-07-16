import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToStreamFrom');
const baseErr = 'Subscribe to Stream From - ';

export default (config) => async (
	streamName,
	fromEventNumber,
	onEventAppeared,
	onLiveProcessingStarted,
	onDropped,
	settings
) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	settings = settings || {};
	if (!fromEventNumber) fromEventNumber = 'start';

	const connection = await connectionManager.getOrCreate(config);
	const subscription = await connection.subscribeToStream(streamName, { fromRevision: fromEventNumber, resolveLinkTos: settings.resolveLinkTos });
	wireSubscription(subscription, onEventAppeared, onDropped);
	//The SDK signals the catch-up to live transition with a caughtUp event
	if (onLiveProcessingStarted) subscription.once('caughtUp', () => onLiveProcessingStarted(subscription));

	debug('', 'Subscription: %j', subscription);
	return subscription;
};
