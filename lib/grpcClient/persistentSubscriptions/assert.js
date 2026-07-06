import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

import {
	persistentSubscriptionToStreamSettingsFromDefaults,
} from '@kurrent/kurrentdb-client';

const debug = debugModule('geteventstore:assertPersistentSubscription');
const baseErr = 'Assert persistent subscriptions - ';

export default (config) => async (name, streamName, options = {}) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	options.startFrom = options.startPosition || options.startFrom || 'start';
	const settings = persistentSubscriptionToStreamSettingsFromDefaults(options);

	const connection = await connectionManager.create(config, true);
	try {
		try {
			debug('', 'Create: %j', settings);
			await connection.createPersistentSubscriptionToStream(streamName, name, settings);
		} catch (err) {
			if (err.type !== 'persistent-subscription-exists') throw err;

			debug('', 'Update: %j', settings);
			await connection.updatePersistentSubscriptionToStream(streamName, name, settings);
		}
	} finally {
		connection.releaseConnection();
	}
};
