import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:deleteStream');
const baseErr = 'Delete Stream - ';

export default (config) => {
	const checkStreamExists = require('./checkStreamExists')(config);

	return async(streamName, hardDelete) => {
		assert(streamName, `${baseErr}Stream Name not provided`);

		const exists = await checkStreamExists(streamName);
		if (!exists) throw new Error('Stream does not exist');

		let options = {
			uri: `${config.baseUrl}/streams/${streamName}`,
			method: 'DELETE',
			resolveWithFullResponse: true,
			timeout: config.timeout
		};

		if (hardDelete) {
			options.headers = {
				"ES-HardDelete": "true"
			};
		}

		debug('', 'Options: %j', options);
		const response = await req(options);
		debug('', 'Response: %j', response);
		return response;
	};
};