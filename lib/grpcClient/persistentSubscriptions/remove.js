import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:removePersistentSubscription');
const baseErr = 'Remove persistent subscriptions - ';

export default (config) => async (name, streamName) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	debug('', 'Remove: %s/%s', streamName, name);
	const connection = await connectionManager.getOrCreate(config);
	return connection.deletePersistentSubscriptionToStream(streamName, name);
};
