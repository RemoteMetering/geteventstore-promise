import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:deleteStream');
const baseErr = 'Delete Stream - ';

export default (config, checkStreamExists) => async (streamName, hardDelete) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const exists = await checkStreamExists(streamName);
	if (!exists) throw new Error('Stream does not exist');

	const options = {
		url: `${config.baseUrl}/streams/${streamName}`,
		method: 'DELETE',
		timeout: config.timeout
	};

	if (hardDelete) {
		options.headers = {
			"ES-HardDelete": "true"
		};
	}

	debug('', 'Options: %j', options);
	const response = await axios(options);
	debug('', 'Response: %j', response.data);
	return response.data;
};