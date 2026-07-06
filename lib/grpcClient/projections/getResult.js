import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getResult');
const baseErr = 'Get Projection Result - ';

export default (config) => async (name, options) => {
	assert(name, `${baseErr}Name not provided`);

	options = options || {};
	const commandOptions = {};
	if (options.partition) commandOptions.partition = options.partition;

	const connection = await connectionManager.create(config);
	try {
		debug('', 'Options: %j', commandOptions);
		const result = await connection.getProjectionResult(name, commandOptions);
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};
