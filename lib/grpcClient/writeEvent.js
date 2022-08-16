import generateEventId from '../utilities/generateEventId';
import connectionManager from './connectionManager';
import { jsonEvent } from '@eventstore/db-client';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:writeEvent');
const baseErr = 'Write Event - ';

export default (config) => async (streamName, eventType, data, metaData, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(eventType, `${baseErr}Event Type not provided`);
	assert(data, `${baseErr}Event Data not provided`);

	options = options || {};
	options.expectedVersion = [null, undefined, -2].includes(options.expectedVersion) ? "any" : options.expectedVersion;

	const event = jsonEvent({
		id: generateEventId(),
		type: eventType,
		data,
		metadata: metaData
	});

	const connection = await connectionManager.create(config);

	try {
		const result = await connection.appendToStream(streamName, [event], { expectedRevision: options.expectedVersion });
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};