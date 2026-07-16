import connectionManager from './connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

import {
	persistentSubscriptionToAllSettingsFromDefaults,
} from "@kurrent/kurrentdb-client";

const debug = debugModule('metronomic-kurrentdb-client:createPersistentSubscriptionToAll');
const baseErr = 'Create Persistent Subscription to All - ';

export default (config) => async (
	groupName,
	settings = {}
) => {
	assert(groupName, `${baseErr}Group Name not provided`);

	// filter is a create-time command option (event type / stream prefix), not a
	// persistent subscription setting, so keep it out of the settings builder.
	const { filter, startPosition, ...rest } = settings;
	rest.startFrom = startPosition || rest.startFrom || 'start';

	const connection = await connectionManager.getOrCreate(config);
	const result = await connection.createPersistentSubscriptionToAll(groupName, persistentSubscriptionToAllSettingsFromDefaults(rest), filter ? { filter } : undefined);
	debug('', 'Persistent Subscription To All Create: %j', result);
	return result;
};
