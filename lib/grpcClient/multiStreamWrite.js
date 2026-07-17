import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import toExpectedState from './utilities/toExpectedState.js';
import toJsonEvent from './utilities/toJsonEvent.js';

const debug = debugModule('metronomic-kurrentdb-client:multiStreamWrite');
const baseErr = 'Multi Stream Write - ';

export default (config) => async (writes) => {
  assert(writes, `${baseErr}Writes not provided`);
  assert.equal(true, writes.constructor === Array, `${baseErr}Writes should be an array`);

  if (writes.length === 0) return undefined;

  const requests = writes.map((write, index) => {
    assert(write.streamName, `${baseErr}Stream Name not provided for write at index ${index}`);
    assert(write.events, `${baseErr}Events not provided for write at index ${index}`);
    assert.equal(
      true,
      write.events.constructor === Array,
      `${baseErr}Events should be an array for write at index ${index}`
    );

    return {
      streamName: write.streamName,
      expectedState: toExpectedState(write.expectedVersion),
      events: write.events.map(toJsonEvent)
    };
  });

  const connection = await connectionManager.getOrCreate(config);
  const result = await connection.multiStreamAppend(requests);
  debug('', 'Result: %j', result);
  return result;
};
