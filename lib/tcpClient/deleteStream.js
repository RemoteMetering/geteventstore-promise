import connectionManager from './connectionManager';
import assert from 'assert';

const baseErr = 'Delete stream - ';

export default (config) => async(streamName, hardDelete) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	hardDelete = hardDelete === undefined ? false : hardDelete;

	const connection = await connectionManager.create(config);
	return connection.deleteStream(streamName, -2, hardDelete, config.credentials);
};