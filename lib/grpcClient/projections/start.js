import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:startProjection');
const baseErr = 'Start Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const connection = await connectionManager.create(config);
	try {
		debug('', 'Start: %s', name);
		await connection.enableProjection(name);
	} finally {
		connection.releaseConnection();
	}
};
