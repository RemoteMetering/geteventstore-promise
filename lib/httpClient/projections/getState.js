import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import _ from 'lodash';
import url from 'url';

const debug = debugModule('geteventstore:getProjectionState');
const baseErr = 'Get Projection State - ';

export default (config) => {
	const buildUrl = (name) => {
		const urlObj = JSON.parse(JSON.stringify(config));
		urlObj.pathname = `/projection/${name}/state`;
		return url.format(urlObj);
	};

	return async(name, options) => {
		assert(name, `${baseErr}Name not provided`);

		const qs = {};
		options = options || {};

		if (!_.isEmpty(options.partition)) qs.partition = options.partition;
		const urlOptions = {
			uri: buildUrl(name),
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
};