import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:checkStreamExists');
const baseErr = 'Check Stream Exists - ';

export default (config, httpClient) => async (streamName) => {
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
		const response = await httpClient(options);
		debug('', 'Response: %j', response.data);
		return true;
	} catch (err) {
		if (!err.response || err.response.status !== 404) throw err;
		return false;
	}
};