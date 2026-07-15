import withConnection from './utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

import {
	persistentSubscriptionToStreamSettingsFromDefaults,
} from "@kurrent/kurrentdb-client";

const debug = debugModule('metronomic-kurrentdb-client:persistentSubscriptionToStream');
const baseErr = 'Create Persistent Subscription to Stream - ';

export default (config) => async (
	streamName,
	groupName,
	settings = {}
) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(groupName, `${baseErr}Group Name not provided`);

	settings.startFrom = settings.startPosition || 'start';
	const result = await withConnection(config, (connection) => connection.createPersistentSubscriptionToStream(streamName, groupName, persistentSubscriptionToStreamSettingsFromDefaults(settings)), true);
	debug('', 'Persistent Subscription Create: %j', result);
	return result;
};
