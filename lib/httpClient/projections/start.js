import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:startProjection');
const baseErr = 'Start Projection - ';

export default (config) => async(name) => {
	assert(name, `${baseErr}Name not provided`);

	const options = {
		uri: `${config.baseUrl}/projection/${name}/command/enable`,
		method: 'POST',
		json: true
	};

	debug('', 'Options: %j', options);
	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};