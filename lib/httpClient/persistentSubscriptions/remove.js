import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:removePersistentSubscription');
const baseErr = 'Remove persistent subscriptions - ';

export default (config) => async (name, streamName) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	const response = await axios.delete(`${config.baseUrl}/subscriptions/${streamName}/${name}`);
	debug('', 'Response: %j', response.data);
	return response.data;
};