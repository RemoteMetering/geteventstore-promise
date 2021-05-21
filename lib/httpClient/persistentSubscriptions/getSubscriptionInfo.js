import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getSubscriptionInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config, httpClient) => async (name, streamName) => {
	assert(name, `${baseError}Persistent Subscription Name not provided`);
	assert(streamName, `${baseError}Stream name not provided`);

	const response = await httpClient.get(`${config.baseUrl}/subscriptions/${streamName}/${name}/info`);
	debug('', 'Response: %j', response.data);
	return response.data;
};