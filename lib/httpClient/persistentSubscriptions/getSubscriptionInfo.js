import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:getSubscriptionInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async (name, stream) => {
	assert(name, `${baseError}Persistent Subscription Name not provided`);
	assert(stream, `${baseError}Stream not provided`);

	const response = await axios.get(`${config.baseUrl}/subscriptions/${stream}/${name}/info`);
	debug('', 'Response: %j', response.data);
	return response.data;
};