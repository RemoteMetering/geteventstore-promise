import debugModule from 'debug';
import axios from 'axios';

const debug = debugModule('geteventstore:ping');

export default (config) => async () => {
	const options = {
		url: `${config.baseUrl}/ping`,
		method: 'GET',
		timeout: config.timeout
	};

	debug('', 'Options: %j', options);
	const response = await axios(options);
	debug('', 'Response: %j', response.data);
	return response.data;
};