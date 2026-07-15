import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:getResult');
const baseErr = 'Get Projection Result - ';

export default (config) => async (name, options) => {
	assert(name, `${baseErr}Name not provided`);

	options = options || {};
	const commandOptions = {};
	if (options.partition) commandOptions.partition = options.partition;

	debug('', 'Options: %j', commandOptions);
	const result = await withConnection(config, (connection) => connection.getProjectionResult(name, commandOptions));
	debug('', 'Result: %j', result);
	return result;
};
