import withConnection from './utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:getStreamMetadata');
const baseErr = 'Get stream metadata - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const result = await withConnection(config, (connection) => connection.getStreamMetadata(streamName));
	debug('', 'Result: %j', result);
	return result;
};
