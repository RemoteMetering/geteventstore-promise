import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:getProjectionState');
const baseErr = 'Get Projection State - ';

export default (config) => async (name, options) => {
	assert(name, `${baseErr}Name not provided`);

	options = options || {};
	const commandOptions = {};
	if (options.partition) commandOptions.partition = options.partition;

	debug('', 'Options: %j', commandOptions);
	const state = await withConnection(config, (connection) => connection.getProjectionState(name, commandOptions));
	debug('', 'State: %j', state);
	return state;
};
