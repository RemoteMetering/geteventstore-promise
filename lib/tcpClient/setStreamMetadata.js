import debugModule from 'debug';
import assert from 'assert';
import toRawStreamMetadata from '../utilities/toRawStreamMetadata.js';
import toExpectedVersion from '../utilities/toExpectedVersion.js';
import connectionManager from './connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:setStreamMetadata');
const baseErr = 'Set stream metadata - ';

export default (config) => async (streamName, metadata, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(metadata, `${baseErr}Metadata not provided`);

  const expectedVersion = toExpectedVersion(options && options.expectedVersion);

  const connection = await connectionManager.create(config);
  try {
    const result = await connection.setStreamMetadataRaw(
      streamName,
      expectedVersion,
      toRawStreamMetadata(metadata),
      config.credentials
    );
    debug('', 'Result: %j', result);
    return result;
  } finally {
    connection.releaseConnection();
  }
};
