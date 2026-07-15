import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => async (name, deleteCheckpointStream, deleteStateStream) => {
	assert(name, `${baseErr}Name not provided`);

	deleteCheckpointStream = deleteCheckpointStream || false;
	deleteStateStream = deleteStateStream || false;

	debug('', 'Remove: %s', name);
	return withConnection(config, (connection) => connection.deleteProjection(name, { deleteCheckpointStream, deleteStateStream }));
};
