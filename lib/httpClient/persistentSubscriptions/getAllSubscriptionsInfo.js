import debugModule from 'debug';
import axios from 'axios';

const debug = debugModule('geteventstore:getAllSubscriptionsInfo');

export default (config) => async () => {
	const response = await axios.get(`${config.baseUrl}/subscriptions`);
	debug('', 'Response: %j', response.data);
	return response.data;
};