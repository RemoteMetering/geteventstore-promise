import { STREAM_STATE } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import toExpectedState from './utilities/toExpectedState.js';
import toJsonEvent from './utilities/toJsonEvent.js';

const debug = debugModule('metronomic-kurrentdb-client:multiStreamWriteCrossStreamConsistency');
const baseErr = 'Multi Stream Write Cross Stream Consistency - ';

export default (config) => async (writes, checks) => {
  assert(writes, `${baseErr}Writes not provided`);
  assert(Array.isArray(writes), `${baseErr}Writes should be an array`);
  if (checks !== undefined) assert(Array.isArray(checks), `${baseErr}Checks should be an array`);

  if (writes.length === 0) return undefined;

  const records = writes.map((write, index) => {
    assert(write.streamName, `${baseErr}Stream Name not provided for write at index ${index}`);
    assert(write.event, `${baseErr}Event not provided for write at index ${index}`);

    return {
      streamName: write.streamName,
      record: toJsonEvent(write.event)
    };
  });

  const consistencyChecks = (checks || []).map((check, index) => {
    assert(check.streamName, `${baseErr}Stream Name not provided for check at index ${index}`);
    return {
      type: STREAM_STATE,
      streamName: check.streamName,
      expectedState: toExpectedState(check.expectedVersion)
    };
  });

  const connection = await connectionManager.getOrCreate(config);
  const result = await connection.appendRecords(records, consistencyChecks.length ? consistencyChecks : undefined);
  debug('', 'Result: %j', result);
  return result;
};
