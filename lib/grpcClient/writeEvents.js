import connectionManager from './connectionManager';
import { jsonEvent } from '@eventstore/db-client';
import chunkArray from '../utilities/chunkArray';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => async (streamName, events, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(events, `${baseErr}Events not provided`);
	assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

	if (events.length === 0) return;

	options = options || {};
	options.transactionWriteSize = options.transactionWriteSize || 250;
	options.expectedVersion = [null, undefined, -2].includes(options.expectedVersion) ? "any" : options.expectedVersion;

	const eventsToWrite = events.map(ev => jsonEvent({
		id: ev.eventId,
		type: ev.eventType,
		data: ev.data,
		metadata: ev.metaData
	}));
	const connection = await connectionManager.create(config);
	try {
		const result = await connection.appendToStream(streamName, eventsToWrite, { expectedRevision: options.expectedVersion });
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};