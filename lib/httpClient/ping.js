import req from 'request-promise';
import debugModule from 'debug';

const debug = debugModule('geteventstore:ping');

export default (config) => async() => {
	const options = {
		uri: `${config.baseUrl}/ping`,
		method: 'GET',
		timeout: config.timeout
	};

	debug('', 'Options: %j', options);
	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};