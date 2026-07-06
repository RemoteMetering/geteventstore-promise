import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:stopProjection');
const baseErr = 'Stop Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const connection = await connectionManager.create(config);
	try {
		debug('', 'Stop: %s', name);
		await connection.disableProjection(name);
	} finally {
		connection.releaseConnection();
	}
};
