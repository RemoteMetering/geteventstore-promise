import axios from '../utilities/axios';
import debugModule from 'debug';

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