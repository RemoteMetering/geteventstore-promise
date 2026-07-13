import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:resetProjection');
const baseErr = 'Reset Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const connection = await connectionManager.create(config);
	try {
		debug('', 'Reset: %s', name);
		await connection.resetProjection(name);
	} finally {
		connection.releaseConnection();
	}
};
