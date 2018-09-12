import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';
import _ from 'lodash';

const debug = debugModule('geteventstore:getProjectionState');
const baseErr = 'Get Projection State - ';

export default (config) => async (name, options) => {
	assert(name, `${baseErr}Name not provided`);

	const params = {};
	options = options || {};

	if (!_.isEmpty(options.partition)) params.partition = options.partition;
	const urlOptions = {
		url: `${config.baseUrl}/projection/${name}/state`,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json"
		},
		method: 'get',
		params
	};
	debug('', 'Options: %j', options);
	const response = await axios(urlOptions);
	debug('', 'Response: %j', response.data);
	return response.data;
};