import connectionManager from '../connectionManager.js';
import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:getAllSubscriptionsInfo');

export default (config) => async () => {
	const connection = await connectionManager.create(config);
	try {
		const info = await connection.listAllPersistentSubscriptions();
		debug('', 'Info: %j', info);
		return info;
	} finally {
		connection.releaseConnection();
	}
};
