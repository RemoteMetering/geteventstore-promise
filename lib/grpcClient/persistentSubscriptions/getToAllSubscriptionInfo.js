import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:getToAllSubscriptionInfo');
const baseError = 'Get To All Subscription Info - ';

export default (config) => async (name) => {
  assert(name, `${baseError}Persistent Subscription Name not provided`);

  const connection = await connectionManager.getOrCreate(config);
  const info = await connection.getPersistentSubscriptionToAllInfo(name);
  debug('', 'Info: %j', info);
  return info;
};
