import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:stopProjection');
const baseErr = 'Stop Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	debug('', 'Stop: %s', name);
	return withConnection(config, (connection) => connection.disableProjection(name));
};
