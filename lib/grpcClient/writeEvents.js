import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import toExpectedState from './utilities/toExpectedState.js';
import toJsonEvent from './utilities/toJsonEvent.js';

const debug = debugModule('metronomic-kurrentdb-client:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => async (streamName, events, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(events, `${baseErr}Events not provided`);
  assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

  if (events.length === 0) return undefined;

  options = options || {};
  const streamState = toExpectedState(options.expectedVersion);

  const eventsToWrite = events.map(toJsonEvent);
  const connection = await connectionManager.getOrCreate(config);
  const result = await connection.appendToStream(streamName, eventsToWrite, {
    streamState,
    batchAppendSize: options.batchAppendSizeInBytes
  });
  debug('', 'Result: %j', result);
  return result;
};
