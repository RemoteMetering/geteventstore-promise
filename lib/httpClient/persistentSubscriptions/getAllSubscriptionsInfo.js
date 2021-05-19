import axios from '../../utilities/axios';
import debugModule from 'debug';

const debug = debugModule('geteventstore:getAllSubscriptionsInfo');

export default (config) => async () => {
	const response = await axios.get(`${config.baseUrl}/subscriptions`);
	debug('', 'Response: %j', response.data);
	return response.data;
};