import connectionManager from './connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:writeEvent');
const baseErr = 'Get stream metadata - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const connection = await connectionManager.create(config);

	try {
		const result = await connection.getStreamMetadata(streamName);
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};