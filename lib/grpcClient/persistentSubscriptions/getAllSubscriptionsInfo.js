import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:getAllSubscriptionsInfo');

export default (config) => async () => {
	const info = await withConnection(config, (connection) => connection.listAllPersistentSubscriptions());
	debug('', 'Info: %j', info);
	return info;
};
