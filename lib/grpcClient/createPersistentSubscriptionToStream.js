import connectionManager from './connectionManager.js';
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
	const connection = await connectionManager.getOrCreate(config);
	const result = await connection.createPersistentSubscriptionToStream(streamName, groupName, persistentSubscriptionToStreamSettingsFromDefaults(settings));
	debug('', 'Persistent Subscription Create: %j', result);
	return result;
};
