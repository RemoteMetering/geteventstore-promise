import debugModule from 'debug';
import connectionManager from '../connectionManager.js';
import { jsonSafe } from '../utilities/jsonSafe.js';

const debug = debugModule('metronomic-kurrentdb-client:getToAllSubscriptionsInfo');

export default (config) => async () => {
  const connection = await connectionManager.getOrCreate(config);
  const info = jsonSafe(await connection.listPersistentSubscriptionsToAll());
  debug('', 'Info: %j', info);
  return info;
};
