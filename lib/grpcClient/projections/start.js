import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:startProjection');
const baseErr = 'Start Projection - ';

export default (config) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	debug('', 'Start: %s', name);
	return withConnection(config, (connection) => connection.enableProjection(name));
};
