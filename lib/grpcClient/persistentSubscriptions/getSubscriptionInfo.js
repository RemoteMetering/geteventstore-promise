import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:getSubscriptionInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async (name, streamName) => {
	assert(name, `${baseError}Persistent Subscription Name not provided`);
	assert(streamName, `${baseError}Stream name not provided`);

	const info = await withConnection(config, (connection) => connection.getPersistentSubscriptionToStreamInfo(streamName, name));
	debug('', 'Info: %j', info);
	return info;
};
