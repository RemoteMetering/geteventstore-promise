import connectionManager from './connectionManager';
import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import uuid from 'uuid';

const debug = debugModule('geteventstore:writeEvent');
const baseErr = 'Write Event - ';

export default (config) => async (streamName, eventType, data, metaData, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(eventType, `${baseErr}Event Type not provided`);
	assert(data, `${baseErr}Event Data not provided`);

	options = options || {};
	options.expectedVersion = !Number.isInteger(options.expectedVersion) ? -2 : options.expectedVersion;
	const event = client.createJsonEventData(uuid.v4(), data, metaData, eventType);
	const connection = await connectionManager.create(config);
	
	try {
		const result = await connection.appendToStream(streamName, options.expectedVersion, [event], config.credentials);
		debug('', 'Result: %j', result);
		if (result.error) throw new Error(result.error);
		return result;
	} catch (err) {
		throw err;
	} finally {
		connection.releaseConnection();
	}
};