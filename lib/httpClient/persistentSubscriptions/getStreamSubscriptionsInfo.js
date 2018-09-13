import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async(streamName) => {
	assert(streamName, `${baseError}Stream name not provided`);

	const response = await axios.get(`${config.baseUrl}/subscriptions/${streamName}`);
	debug('', 'Response: %j', response.data);
	return response.data;
};