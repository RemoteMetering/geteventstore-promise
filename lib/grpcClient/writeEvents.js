import connectionManager from './connectionManager.js';
import { jsonEvent } from '@kurrent/kurrentdb-client';
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
	options.expectedVersion = [null, undefined, -2].includes(options.expectedVersion) ? "any" : options.expectedVersion;

	const eventsToWrite = events.map(ev => jsonEvent({
		id: ev.eventId,
		type: ev.eventType,
		data: ev.data,
		metadata: ev.metaData
	}));
	const connection = await connectionManager.create(config);
	try {
		const result = await connection.appendToStream(streamName, eventsToWrite, { streamState: options.expectedVersion, batchAppendSize: options.batchAppendSizeInBytes });
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};