import req from 'request-promise';
import debugModule from 'debug';
import url from 'url';

const debug = debugModule('geteventstore:getAllSubscriptionsInfo');

export default (config) => {
	const buildUrl = () => {
		const urlObj = JSON.parse(JSON.stringify(config));
		urlObj.pathname = '/subscriptions';
		return url.format(urlObj);
	};

	return async() => {
		const options = {
			uri: buildUrl(),
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
};