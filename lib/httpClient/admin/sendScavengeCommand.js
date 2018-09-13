import debugModule from 'debug';
import axios from 'axios';

const debug = debugModule('geteventstore:sendScavengeCommand');

export default (config) => async () => {
	const response = await axios.post(`${config.baseUrl}/admin/scavenge`);
	debug('', 'Response: %j', response.data);
	return response.data;
};