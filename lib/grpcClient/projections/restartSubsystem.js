import connectionManager from '../connectionManager.js';
import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:restartProjectionSubsystem');

export default (config) => async () => {
	debug('', 'Restart projection subsystem');
	const connection = await connectionManager.getOrCreate(config);
	return connection.restartSubsystem();
};
