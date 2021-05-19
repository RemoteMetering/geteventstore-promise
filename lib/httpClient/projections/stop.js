import axios from '../../utilities/axios';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:stopProjection');
const baseErr = 'Stop Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const response = await axios.post(`${config.baseUrl}/projection/${name}/command/disable`);
	debug('', 'Response: %j', response.data);
	return response.data;
};