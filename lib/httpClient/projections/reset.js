import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:resetProjection');
const baseErr = 'Reset Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);
	
	const response = await axios.post(`${config.baseUrl}/projection/${name}/command/reset`);
	debug('', 'Response: %j', response.data);
	return response.data;
};