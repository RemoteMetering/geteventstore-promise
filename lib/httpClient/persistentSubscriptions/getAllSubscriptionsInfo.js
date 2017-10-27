import req from 'request-promise';
import debugModule from 'debug';

const debug = debugModule('geteventstore:getAllSubscriptionsInfo');

export default (config) => async() => {
	const options = {
		uri: `${config.baseUrl}/subscriptions`,
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