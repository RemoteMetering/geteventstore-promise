import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getProjectionState');
const baseErr = 'Get Projection State - ';

export default (config, httpClient) => async (name, options) => {
	assert(name, `${baseErr}Name not provided`);

	const params = {};
	options = options || {};

	if (options.partition) params.partition = options.partition;
	const urlOptions = {
		url: `${config.baseUrl}/projection/${name}/state`,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json"
		},
		method: 'GET',
		params
	};
	debug('', 'Options: %j', options);
	const response = await httpClient(urlOptions);
	debug('', 'Response: %j', response.data);
	return response.data;
};