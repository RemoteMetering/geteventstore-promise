import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:removeProjection');
const baseErr = 'Remove Projection - ';

export default (config) => {
	const buildUrl = (name) => {
		const urlObj = JSON.parse(JSON.stringify(config));
		urlObj.pathname = `/projection/${name}`;
		return url.format(urlObj);
	};

	return async(name, deleteCheckpointStream, deleteStateStream) => {
		assert(name, `${baseErr}Name not provided`);

		deleteCheckpointStream = deleteCheckpointStream || false;
		deleteStateStream = deleteStateStream || false;

		const options = {
			uri: buildUrl(name),
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
};