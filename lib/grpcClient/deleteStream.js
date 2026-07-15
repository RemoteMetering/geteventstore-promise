import withConnection from './utilities/withConnection.js';
import assert from 'assert';

const baseErr = 'Delete stream - ';

export default (config) => async (streamName, hardDelete) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	hardDelete = hardDelete === undefined ? false : hardDelete;

	return withConnection(config, (connection) => hardDelete ? connection.tombstoneStream(streamName) : connection.deleteStream(streamName));
};
