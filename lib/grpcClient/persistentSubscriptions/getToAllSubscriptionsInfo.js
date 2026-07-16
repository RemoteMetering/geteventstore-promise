import connectionManager from '../connectionManager.js';
import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:getToAllSubscriptionsInfo');

export default (config) => async () => {
	const connection = await connectionManager.getOrCreate(config);
	const info = await connection.listPersistentSubscriptionsToAll();
	debug('', 'Info: %j', info);
	return info;
};
