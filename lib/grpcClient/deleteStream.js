import connectionManager from './connectionManager.js';
import assert from 'assert';

const baseErr = 'Delete stream - ';

export default (config) => async (streamName, hardDelete) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	hardDelete = hardDelete === undefined ? false : hardDelete;

	const connection = await connectionManager.getOrCreate(config);
	return hardDelete ? connection.tombstoneStream(streamName) : connection.deleteStream(streamName);
};
