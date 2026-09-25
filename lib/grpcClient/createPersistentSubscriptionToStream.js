import debugModule from 'debug';
import assert from 'assert';

import { persistentSubscriptionToStreamSettingsFromDefaults } from '@kurrent/kurrentdb-client';
import connectionManager from './connectionManager.js';
import { splitPersistentSettings, toStreamRevision } from './utilities/positions.js';

const debug = debugModule('metronomic-kurrentdb-client:persistentSubscriptionToStream');
const baseErr = 'Create Persistent Subscription to Stream - ';

export default (config) =>
  async (streamName, groupName, settings = {}) => {
    assert(streamName, `${baseErr}Stream Name not provided`);
    assert(groupName, `${baseErr}Group Name not provided`);

    const { settings: rest } = splitPersistentSettings(settings, toStreamRevision, baseErr);
    const connection = await connectionManager.getOrCreate(config);
    const result = await connection.createPersistentSubscriptionToStream(
      streamName,
      groupName,
      persistentSubscriptionToStreamSettingsFromDefaults(rest)
    );
    debug('', 'Persistent Subscription Create: %j', result);
    return result;
  };
