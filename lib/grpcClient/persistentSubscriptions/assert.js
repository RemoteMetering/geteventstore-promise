import debugModule from 'debug';
import assert from 'assert';

import { persistentSubscriptionToStreamSettingsFromDefaults } from '@kurrent/kurrentdb-client';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:assertPersistentSubscription');
const baseErr = 'Assert persistent subscriptions - ';

export default (config) =>
  async (name, streamName, options = {}) => {
    assert(name, `${baseErr}Persistent Subscription Name not provided`);
    assert(streamName, `${baseErr}Stream Name not provided`);

    const settings = persistentSubscriptionToStreamSettingsFromDefaults({
      ...options,
      startFrom: options.startPosition || options.startFrom || 'start'
    });

    const connection = await connectionManager.getOrCreate(config);
    try {
      debug('', 'Create: %j', settings);
      await connection.createPersistentSubscriptionToStream(streamName, name, settings);
    } catch (err) {
      if (err.type !== 'persistent-subscription-exists') throw err;

      debug('', 'Update: %j', settings);
      await connection.updatePersistentSubscriptionToStream(streamName, name, settings);
    }
  };
