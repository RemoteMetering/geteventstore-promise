import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:removePersistentSubscription');
const baseErr = 'Remove persistent subscriptions - ';

const createRemoveRequest = (config, name, streamName) => {
	const request = {
		uri: `${config.baseUrl}/subscriptions/${streamName}/${name}`,
		method: 'DELETE',
		json: true
	};
	return request;
};

export default (config) => async(name, streamName) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	const options = createRemoveRequest(config, name, streamName);
	debug('', 'Options: %j', options);
	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};