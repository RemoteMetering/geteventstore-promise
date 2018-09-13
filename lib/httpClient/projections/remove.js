import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => async (name, deleteCheckpointStream, deleteStateStream) => {
	assert(name, `${baseErr}Name not provided`);

	deleteCheckpointStream = deleteCheckpointStream || false;
	deleteStateStream = deleteStateStream || false;

	const options = {
		url: `${config.baseUrl}/projection/${name}`,
		method: 'DELETE',
		params: {
			deleteCheckpointStream: deleteCheckpointStream ? 'yes' : 'no',
			deleteStateStream: deleteStateStream ? 'yes' : 'no'
		}
	};

	debug('', 'Options: %j', options);
	const response = await axios(options);
	debug('', 'Response: %j', response.data);
	return response.data;
};