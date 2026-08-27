import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:getSubscriptionInfo');
const baseError = 'Get Subscription Info - ';

export default (config) => async (name, streamName) => {
  assert(name, `${baseError}Persistent Subscription Name not provided`);
  assert(streamName, `${baseError}Stream name not provided`);

  const connection = await connectionManager.getOrCreate(config);
  const info = await connection.getPersistentSubscriptionToStreamInfo(streamName, name);
  debug('', 'Info: %j', info);
  return info;
};
