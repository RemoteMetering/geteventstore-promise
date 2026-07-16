import connectionManager from './connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:setStreamMetadata');
const baseErr = 'Set stream metadata - ';

export default (config) => async (streamName, metadata, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(metadata, `${baseErr}Metadata not provided`);

	const connection = await connectionManager.getOrCreate(config);
	const result = await connection.setStreamMetadata(streamName, metadata, options);
	debug('', 'Result: %j', result);
	return result;
};
