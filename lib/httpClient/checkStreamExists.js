import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:checkStreamExists');
const baseErr = 'Check Stream Exists - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const options = {
		url: `${config.baseUrl}/streams/${streamName}/head/backward/1`,
		method: 'GET',
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json"
		},
		timeout: config.timeout
	};

	debug('', 'Options: %j', options);
	try {
		const response = await axios(options);
		debug('', 'Response: %j', response.data);
		return true;
	} catch (err) {
		if (!err.response || err.response.status !== 404) throw err;
		return false;
	}
};