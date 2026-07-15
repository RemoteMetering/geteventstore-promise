import withConnection from './utilities/withConnection.js';
import toExpectedState from './utilities/toExpectedState.js';
import toJsonEvent from './utilities/toJsonEvent.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => async (streamName, events, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(events, `${baseErr}Events not provided`);
	assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

	if (events.length === 0) return;

	options = options || {};
	const streamState = toExpectedState(options.expectedVersion);

	const eventsToWrite = events.map(toJsonEvent);
	const result = await withConnection(config, (connection) => connection.appendToStream(streamName, eventsToWrite, { streamState, batchAppendSize: options.batchAppendSizeInBytes }));
	debug('', 'Result: %j', result);
	return result;
};
