import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';

// Factory for the one-shot projection commands (start, stop, reset) that
// differ only in the SDK method they call.
export default (config, method, label) => {
  const debug = debugModule(`metronomic-kurrentdb-client:${label.toLowerCase()}Projection`);
  const baseErr = `${label} Projection - `;

  return async (name) => {
    assert(name, `${baseErr}Name not provided`);

    debug('', '%s: %s', label, name);
    const connection = await connectionManager.getOrCreate(config);
    return connection[method](name);
  };
};
