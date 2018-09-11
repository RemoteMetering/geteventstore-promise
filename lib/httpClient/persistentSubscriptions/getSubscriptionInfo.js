import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getSubscriptionInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async(name, stream) => {
	assert(name, `${baseError}Persistent Subscription Name not provided`);
	assert(stream, `${baseError}Stream not provided`);

	const options = {
		uri: `${config.baseUrl}/subscriptions/${stream}/${name}/info`,
		method: 'GET',
		json: true,
		headers: {
			'Content-Type': 'application/json',
		}
	};

	debug('', 'Options: %j', options);
	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};