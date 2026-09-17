import debugModule from 'debug';
import assert from 'assert';

import { persistentSubscriptionToAllSettingsFromDefaults } from '@kurrent/kurrentdb-client';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:assertPersistentSubscriptionToAll');
const baseErr = 'Assert persistent subscription to all - ';

export default (config) =>
  async (name, options = {}) => {
    assert(name, `${baseErr}Persistent Subscription Name not provided`);

    // filter is a create-time command option, not a setting. It also cannot be changed
    // on update, so it is only ever passed to the create call.
    const { filter, startPosition, ...rest } = options;
    rest.startFrom = startPosition || rest.startFrom || 'start';
    const settings = persistentSubscriptionToAllSettingsFromDefaults(rest);

    const connection = await connectionManager.getOrCreate(config);
    try {
      debug('', 'Create: %j', settings);
      await connection.createPersistentSubscriptionToAll(name, settings, filter ? { filter } : undefined);
    } catch (err) {
      if (err.type !== 'persistent-subscription-exists') throw err;

      debug('', 'Update: %j', settings);
      await connection.updatePersistentSubscriptionToAll(name, settings);
    }
  };
