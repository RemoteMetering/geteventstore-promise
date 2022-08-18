import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:stopProjection');
const baseErr = 'Stop Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const connection = await connectionManager.create(config);
	try {
		const response = await connection.stopProjection(name);
		debug('', 'Response: %j', response);
		return response;
	} finally {
		connection.releaseConnection();
	}
};