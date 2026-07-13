import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:getAllSubscriptionsInfo');

export default (config, httpClient) => async () => {
	const response = await httpClient.get(`${config.baseUrl}/subscriptions`);
	debug('', 'Response: %j', response.data);
	return response.data;
};