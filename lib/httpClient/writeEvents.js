import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => async (streamName, events, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(events, `${baseErr}Events not provided`);
	assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

	if (events.length === 0) return;

	options = options || {};
	options.expectedVersion = options.expectedVersion || -2;

	const reqOptions = {
		url: `${config.baseUrl}/streams/${streamName}`,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json",
			"ES-ExpectedVersion": options.expectedVersion
		},
		method: 'post',
		data: events,
		timeout: config.timeout
	};

	debug('', 'Write events: %j', reqOptions);
	return (await axios(reqOptions)).data;
};