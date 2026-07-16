import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

// Factory for the projection queries (state, result) that accept a partition option.
export default (config, method, label) => {
	const debug = debugModule(`metronomic-kurrentdb-client:getProjection${label}`);
	const baseErr = `Get Projection ${label} - `;

	return async (name, options) => {
		assert(name, `${baseErr}Name not provided`);

		options = options || {};
		const commandOptions = {};
		if (options.partition) commandOptions.partition = options.partition;

		debug('', 'Options: %j', commandOptions);
		const connection = await connectionManager.getOrCreate(config);
		const result = await connection[method](name, commandOptions);
		debug('', '%s: %j', label, result);
		return result;
	};
};
