import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async(stream) => {
	assert(stream, `${baseError}Stream not provided`);

	const response = await axios.get(`${config.baseUrl}/subscriptions/${stream}`);
	debug('', 'Response: %j', response.data);
	return response.data;
};