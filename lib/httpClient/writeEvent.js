import EventFactory from '../EventFactory';
import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:writeEvent');
const eventFactory = new EventFactory();
const baseErr = 'Write Event - ';

export default (config) => async (streamName, eventType, data, metaData, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(eventType, `${baseErr}Event Type not provided`);
	assert(data, `${baseErr}Event Data not provided`);

	options = options || {};
	options.expectedVersion = isNaN(options.expectedVersion) ? -2 : options.expectedVersion;

	const events = [eventFactory.newEvent(eventType, data, metaData)];

	const reqOptions = {
		url: `${config.baseUrl}/streams/${streamName}`,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json",
			"ES-ExpectedVersion": options.expectedVersion
		},
		method: 'POST',
		data: events,
		timeout: config.timeout
	};

	debug('', 'Write Event: %j', reqOptions);
	const response = await axios(reqOptions);
	debug('', 'Response: %j', response.data);
	return response.data;
};