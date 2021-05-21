import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:removePersistentSubscription');
const baseErr = 'Remove persistent subscriptions - ';

export default (config, httpClient) => async (name, streamName) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	const response = await httpClient.delete(`${config.baseUrl}/subscriptions/${streamName}/${name}`);
	debug('', 'Response: %j', response.data);
	return response.data;
};