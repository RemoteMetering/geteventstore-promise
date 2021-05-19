import axios from '../../utilities/axios';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:startProjection');
const baseErr = 'Start Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const response = await axios.post(`${config.baseUrl}/projection/${name}/command/enable`);
	debug('', 'Response: %j', response.data);
	return response.data;
};