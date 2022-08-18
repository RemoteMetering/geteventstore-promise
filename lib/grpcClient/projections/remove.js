import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => async (name, deleteCheckpointStream, deleteStateStream, deleteEmittedStreams) => {
	assert(name, `${baseErr}Name not provided`);

	deleteCheckpointStream = deleteCheckpointStream || false;
	deleteStateStream = deleteStateStream || false;
	deleteEmittedStreams = deleteEmittedStreams || false;

	const connection = await connectionManager.create(config);
	try {
		const response = await connection.deleteProjection(name, { deleteCheckpointStream, deleteStateStream, deleteEmittedStreams });
		debug('', 'Response: %j', response);
		return response;
	} finally {
		connection.releaseConnection();
	}
};