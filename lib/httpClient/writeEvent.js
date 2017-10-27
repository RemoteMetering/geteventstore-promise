import eventFactory from '../eventFactory';
import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:writeEvent');
const baseErr = 'Write Event - ';

export default (config) => async(streamName, eventType, data, metaData, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(eventType, `${baseErr}Event Type not provided`);
	assert(data, `${baseErr}Event Data not provided`);

	options = options || {};
	options.expectedVersion = options.expectedVersion || -2;

	const events = [eventFactory.NewEvent(eventType, data, metaData)];

	const reqOptions = {
		uri: `${config.baseUrl}/streams/${streamName}`,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json",
			"ES-ExpectedVersion": options.expectedVersion
		},
		method: 'POST',
		body: events,
		json: true,
		timeout: config.timeout
	};

	debug('', 'Write Event: %j', reqOptions);
	return req(reqOptions);
};