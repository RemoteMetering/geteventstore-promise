import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseError}Stream name not provided`);

	const info = await withConnection(config, (connection) => connection.listPersistentSubscriptionsToStream(streamName));
	debug('', 'Info: %j', info);
	return info;
};
