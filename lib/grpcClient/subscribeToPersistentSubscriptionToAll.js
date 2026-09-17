import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import finalizePersistentSubscription from './utilities/finalizePersistentSubscription.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToPersistentSubscriptionToAll');
const baseErr = 'Subscribe to Persistent Subscription To All - ';

export default (config) =>
  async (groupName, onEventAppeared, onDropped, settings = {}, duplexOptions = {}) => {
    assert(groupName, `${baseErr}Group Name not provided`);

    const connection = await connectionManager.getOrCreate(config);

    // Not a Promise - subscribeToPersistentSubscriptionToAll returns the subscription stream synchronously.
    // Success/failure only becomes known once a 'confirmation' or 'error' event is emitted.
    const subscription = connection.subscribeToPersistentSubscriptionToAll(groupName, settings, duplexOptions);

    return finalizePersistentSubscription(subscription, {
      onEventAppeared,
      onDropped,
      includeDeleted: config.includeDeleted,
      debug
    });
  };
