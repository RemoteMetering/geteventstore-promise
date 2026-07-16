import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:removePersistentSubscriptionToAll');
const baseErr = 'Remove persistent subscription to all - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);

	debug('', 'Remove: $all/%s', name);
	const connection = await connectionManager.getOrCreate(config);
	return connection.deletePersistentSubscriptionToAll(name);
};
