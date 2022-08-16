import connectionManager from './connectionManager';
import assert from 'assert';

const baseErr = 'Delete stream - ';

//TODO: Delete Options
export default (config) => async (streamName, hardDelete) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	hardDelete = hardDelete === undefined ? false : hardDelete;

	const connection = await connectionManager.create(config);
	try {
		if (hardDelete) return await connection.tombstoneStream(streamName);
		return await connection.deleteStream(streamName);
	} finally {
		connection.releaseConnection();
	}
};