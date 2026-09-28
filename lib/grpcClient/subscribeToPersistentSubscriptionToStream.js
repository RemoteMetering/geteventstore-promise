import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import finalizePersistentSubscription from './utilities/finalizePersistentSubscription.js';

const debug = debugModule('metronomic-kurrentdb-client:subscribeToPersistentSubscriptionStream');
const baseErr = 'Subscribe to Persistent Subscription Stream - ';

export default (config) =>
  async (streamName, groupName, onEventAppeared, onDropped, settings = {}, duplexOptions = {}) => {
    assert(streamName, `${baseErr}Stream Name not provided`);
    assert(groupName, `${baseErr}Group Name not provided`);

    const connection = await connectionManager.getOrCreate(config);

    // Not a Promise - subscribeToPersistentSubscriptionToStream returns the subscription stream synchronously.
    // Success/failure only becomes known once a 'confirmation' or 'error' event is emitted.
    const subscription = connection.subscribeToPersistentSubscriptionToStream(
      streamName,
      groupName,
      settings,
      duplexOptions
    );

    return finalizePersistentSubscription(subscription, {
      onEventAppeared,
      onDropped,
      includeDeleted: config.includeDeleted,
      debug
    });
  };
