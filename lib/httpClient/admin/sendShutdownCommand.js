import debugModule from 'debug';
import axios from 'axios';

const debug = debugModule('geteventstore:sendShutdownCommand');

export default (config) => async () => {
	const response = await axios.post(`${config.baseUrl}/admin/shutdown`);
	debug('', 'Response: %j', response.data);
	return response.data;
};