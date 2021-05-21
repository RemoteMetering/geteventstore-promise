import debugModule from 'debug';

const debug = debugModule('geteventstore:ping');

export default (config, httpClient) => async () => {
	const options = {
		url: `${config.baseUrl}/ping`,
		method: 'GET',
		timeout: config.timeout
	};

	debug('', 'Options: %j', options);
	const response = await httpClient(options);
	debug('', 'Response: %j', response.data);
	return response.data;
};