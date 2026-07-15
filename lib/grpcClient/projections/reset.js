import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:resetProjection');
const baseErr = 'Reset Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	debug('', 'Reset: %s', name);
	return withConnection(config, (connection) => connection.resetProjection(name));
};
