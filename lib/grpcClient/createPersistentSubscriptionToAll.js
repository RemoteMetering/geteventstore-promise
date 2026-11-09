import debugModule from 'debug';
import assert from 'assert';

import { persistentSubscriptionToAllSettingsFromDefaults } from '@kurrent/kurrentdb-client';
import connectionManager from './connectionManager.js';
import { splitPersistentSettings, toAllPosition } from './utilities/positions.js';

const debug = debugModule('metronomic-kurrentdb-client:createPersistentSubscriptionToAll');
const baseErr = 'Create Persistent Subscription to All - ';

export default (config) =>
  async (groupName, settings = {}) => {
    assert(groupName, `${baseErr}Group Name not provided`);

    const { filter, settings: rest } = splitPersistentSettings(settings, toAllPosition, baseErr);

    const connection = await connectionManager.getOrCreate(config);
    const result = await connection.createPersistentSubscriptionToAll(
      groupName,
      persistentSubscriptionToAllSettingsFromDefaults(rest),
      filter ? { filter } : undefined
    );
    debug('', 'Persistent Subscription To All Create: %j', result);
    return result;
  };
