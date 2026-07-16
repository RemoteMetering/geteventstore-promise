import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => async (name, deleteCheckpointStream, deleteStateStream) => {
	assert(name, `${baseErr}Name not provided`);

	deleteCheckpointStream = deleteCheckpointStream || false;
	deleteStateStream = deleteStateStream || false;

	debug('', 'Remove: %s', name);
	const connection = await connectionManager.getOrCreate(config);
	return connection.deleteProjection(name, { deleteCheckpointStream, deleteStateStream });
};
