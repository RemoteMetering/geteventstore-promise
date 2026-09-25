import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import toExpectedState from './utilities/toExpectedState.js';
import { jsonSafe } from './utilities/jsonSafe.js';

const debug = debugModule('metronomic-kurrentdb-client:setStreamMetadata');
const baseErr = 'Set stream metadata - ';

export default (config) => async (streamName, metadata, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(metadata, `${baseErr}Metadata not provided`);

  // The SDK reads streamState, not the shared expectedVersion option, so translate it here.
  // Without this the write always goes through as 'any'. The check applies to the metastream.
  const { expectedVersion, ...sdkOptions } = options || {};
  if (expectedVersion !== undefined) sdkOptions.streamState = toExpectedState(expectedVersion);

  const connection = await connectionManager.getOrCreate(config);
  const result = jsonSafe(await connection.setStreamMetadata(streamName, metadata, sdkOptions));
  debug('', 'Result: %j', result);
  return result;
};
