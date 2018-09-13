import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getProjectionState');
const baseErr = 'Get Projection State - ';

export default (config) => async (name, options) => {
	assert(name, `${baseErr}Name not provided`);

	const qs = {};
	options = options || {};

	if (options.partition) qs.partition = options.partition;
	const urlOptions = {
		uri: `${config.baseUrl}/projection/${name}/state`,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json"
		},
		method: 'GET',
		json: true,
		qs
	};

	debug('', 'Options: %j', options);
	const response = await req(urlOptions);
	debug('', 'Response: %j', response);
	return response;
};