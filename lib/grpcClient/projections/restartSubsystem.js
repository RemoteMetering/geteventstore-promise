import debugModule from 'debug';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:restartProjectionSubsystem');

export default (config) => async () => {
  debug('', 'Restart projection subsystem');
  const connection = await connectionManager.getOrCreate(config);
  return connection.restartSubsystem();
};
