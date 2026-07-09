import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => async (name, deleteCheckpointStream, deleteStateStream) => {
	assert(name, `${baseErr}Name not provided`);

	deleteCheckpointStream = deleteCheckpointStream || false;
	deleteStateStream = deleteStateStream || false;

	const connection = await connectionManager.create(config);
	try {
		debug('', 'Remove: %s', name);
		await connection.deleteProjection(name, { deleteCheckpointStream, deleteStateStream });
	} finally {
		connection.releaseConnection();
	}
};
