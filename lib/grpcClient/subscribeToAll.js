import connectionManager from './connectionManager.js';
import wireSubscription from './utilities/wireSubscription.js';
import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToAll');
const baseErr = 'Subscribe to All - ';

// Parses the $all start position: 'start', 'end', or a { commit, prepare } object.
const parsePosition = (fromPosition) => {
	if (fromPosition === undefined || fromPosition === 'start' || fromPosition === 'end') return fromPosition || 'start';
	if (typeof fromPosition === 'object') {
		if (fromPosition.commit === undefined || fromPosition.prepare === undefined) {
			throw new Error(`${baseErr}'fromPosition' not valid. Needs to be an object with 'commit' and 'prepare'`);
		}
		return { commit: BigInt(fromPosition.commit), prepare: BigInt(fromPosition.prepare) };
	}
	throw new Error(`${baseErr}'fromPosition' not valid. Needs to be 'start', 'end' or an object with 'commit' and 'prepare'`);
};

export default (config) => async (
	fromPosition,
	onEventAppeared,
	onLiveProcessingStarted,
	onDropped,
	settings = {}
) => {
	const _fromPosition = parsePosition(fromPosition);

	const connection = await connectionManager.getOrCreate(config);
	const subscription = await connection.subscribeToAll({ fromPosition: _fromPosition, resolveLinkTos: settings.resolveLinkTos, filter: settings.filter });
	wireSubscription(subscription, onEventAppeared, onDropped, config.includeDeleted);
	if (onLiveProcessingStarted) subscription.once('caughtUp', () => onLiveProcessingStarted(subscription));

	debug('', 'Subscription: %j', subscription);
	return subscription;
};
