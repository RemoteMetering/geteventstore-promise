import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import toExpectedVersion from '../utilities/toExpectedVersion.js';
import generateEventId from '../utilities/generateEventId.js';

const debug = debugModule('metronomic-kurrentdb-client:writeEvent');
const baseErr = 'Write Event - ';

export default (config) => async (streamName, eventType, data, metaData, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(eventType, `${baseErr}Event Type not provided`);
  assert(data, `${baseErr}Event Data not provided`);

  const expectedVersion = toExpectedVersion(options?.expectedVersion);

  const event = client.createJsonEventData(generateEventId(), data, metaData, eventType);
  const connection = await connectionManager.create(config);

  try {
    const result = await connection.appendToStream(streamName, expectedVersion, [event], config.credentials);
    debug('', 'Result: %j', result);
    if (result.error) throw new Error(result.error);
    return result;
  } finally {
    connection.releaseConnection();
  }
};
