import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:checkStreamExists');
const baseErr = 'Check Stream Exists - ';

export default (config) => async(streamName) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const options = {
		uri: `${config.baseUrl}/streams/${streamName}/head/backward/1`,
		method: 'GET',
		json: true,
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json"
		},
		timeout: config.timeout
	};

	debug('', 'Options: %j', options);
	try {
		const response = await req(options);
		debug('', 'Response: %j', response);
		return true;
	} catch (err) {
		if (err.statusCode !== 404) throw err;
		return false;
	}
};