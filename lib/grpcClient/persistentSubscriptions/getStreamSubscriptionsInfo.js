import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseError}Stream name not provided`);

	const connection = await connectionManager.create(config);
	try {
		const info = await connection.listPersistentSubscriptionsToStream(streamName);
		debug('', 'Info: %j', info);
		return info;
	} finally {
		connection.releaseConnection();
	}
};
