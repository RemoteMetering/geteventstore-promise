import connectionManager from './connectionManager';
import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import uuid from 'uuid';
import _ from 'lodash';

const debug = debugModule('geteventstore:writeEvent');
const baseErr = 'Write Event - ';

export default (config) => async(streamName, eventType, data, metaData, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(eventType, `${baseErr}Event Type not provided`);
	assert(data, `${baseErr}Event Data not provided`);

	options = options || {};
	options.expectedVersion = options.expectedVersion || -2;

	const event = client.createJsonEventData(uuid.v4(), data, metaData, eventType);
	const connection = await connectionManager.create(config);
	const result = await connection.appendToStream(streamName, options.expectedVersion, [event], config.credentials);

	debug('', 'Result: %j', result);
	if (!_.isEmpty(result.error)) throw new Error(result.error);
	return result;
};