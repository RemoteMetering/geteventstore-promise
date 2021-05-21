import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:startProjection');
const baseErr = 'Start Projection - ';

export default (config, httpClient) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const response = await httpClient.post(`${config.baseUrl}/projection/${name}/command/enable`);
	debug('', 'Response: %j', response.data);
	return response.data;
};