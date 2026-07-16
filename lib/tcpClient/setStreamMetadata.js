import toRawStreamMetadata from '../utilities/toRawStreamMetadata.js';
import connectionManager from './connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:setStreamMetadata');
const baseErr = 'Set stream metadata - ';

export default (config) => async (streamName, metadata, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(metadata, `${baseErr}Metadata not provided`);

	options = options || {};
	// -2 is ExpectedVersion.Any, matching the write methods on this client.
	options.expectedVersion = !Number.isInteger(options.expectedVersion) ? -2 : options.expectedVersion;

	const connection = await connectionManager.create(config);
	try {
		const result = await connection.setStreamMetadataRaw(streamName, options.expectedVersion, toRawStreamMetadata(metadata), config.credentials);
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};
