import connectionManager from '../connectionManager';
import debugModule from 'debug';

const debug = debugModule('geteventstore:getAllProjectionsInfo');

export default (config) => async () => {
	const connection = await connectionManager.create(config);
	try {
		const response = await connection.listProjections();
		debug('', 'Response: %j', response);
		return response;
	} finally {
		connection.releaseConnection();
	}
};