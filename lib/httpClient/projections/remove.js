import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => async(name, deleteCheckpointStream, deleteStateStream) => {
	assert(name, `${baseErr}Name not provided`);

	deleteCheckpointStream = deleteCheckpointStream || false;
	deleteStateStream = deleteStateStream || false;

	const options = {
		uri: `${config.baseUrl}/projection/${name}`,
		method: 'DELETE',
		json: true,
		qs: {
			deleteCheckpointStream: deleteCheckpointStream ? 'yes' : 'no',
			deleteStateStream: deleteStateStream ? 'yes' : 'no'
		}
	};

	debug('', 'Options: %j', options);
	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};