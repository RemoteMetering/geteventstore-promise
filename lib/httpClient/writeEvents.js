import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:writeEvents');
const baseErr = 'Write Events - ';

export default (config, httpClient) => async (streamName, events, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(events, `${baseErr}Events not provided`);
	assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

	if (events.length === 0) return;

	options = options || {};
	options.expectedVersion = !Number.isInteger(options.expectedVersion) ? -2 : options.expectedVersion;

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

	debug('', 'Write events: %j', reqOptions);
	const response = await httpClient(reqOptions);
	debug('', 'Response: %j', response.data);
	return response.data;
};