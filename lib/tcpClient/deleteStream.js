import connectionManager from './connectionManager';
import Promise from 'bluebird';
import assert from 'assert';

const baseErr = 'Delete stream - ';

module.exports = config => (streamName, hardDelete) => Promise.resolve().then(() => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	hardDelete = hardDelete === undefined ? false : hardDelete;
	return connectionManager.create(config).then(connection => connection.deleteStream(streamName, -2, hardDelete, config.credentials));
});