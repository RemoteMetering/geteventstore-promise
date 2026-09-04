import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => async (streamName) => {
  assert(streamName, `${baseError}Stream name not provided`);

  const connection = await connectionManager.getOrCreate(config);
  const info = await connection.listPersistentSubscriptionsToStream(streamName);
  debug('', 'Info: %j', info);
  return info;
};
