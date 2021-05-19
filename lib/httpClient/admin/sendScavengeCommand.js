import axios from '../../utilities/axios';
import debugModule from 'debug';

const debug = debugModule('geteventstore:sendScavengeCommand');

export default (config) => async () => {
	const response = await axios.post(`${config.baseUrl}/admin/scavenge`);
	debug('', 'Response: %j', response.data);
	return response.data;
};