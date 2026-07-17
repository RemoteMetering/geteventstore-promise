import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:replayParkedMessagesToAll');
const baseErr = 'Replay parked messages to all - ';

export default (config) => async (name, options) => {
  assert(name, `${baseErr}Persistent Subscription Name not provided`);

  debug('', 'Replay parked messages: $all/%s', name);
  const connection = await connectionManager.getOrCreate(config);
  return connection.replayParkedMessagesToAll(name, options);
};
