import debugModule from 'debug';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:restartPersistentSubscriptionSubsystem');

export default (config) => async () => {
  debug('', 'Restart persistent subscription subsystem');
  const connection = await connectionManager.getOrCreate(config);
  return connection.restartPersistentSubscriptionSubsystem();
};
