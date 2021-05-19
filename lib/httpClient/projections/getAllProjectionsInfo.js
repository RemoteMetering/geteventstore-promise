import axios from '../../utilities/axios';
import debugModule from 'debug';

const debug = debugModule('geteventstore:getAllProjectionsInfo');

export default (config) => async () => {
	const response = await axios.get(`${config.baseUrl}/projections/all-non-transient`);
	debug('', 'Response: %j', response.data);
	return response.data;
};