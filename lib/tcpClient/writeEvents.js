import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';
import chunkArray from '../utilities/chunkArray.js';
import connectionManager from './connectionManager.js';
import toExpectedVersion from '../utilities/toExpectedVersion.js';

const debug = debugModule('metronomic-kurrentdb-client:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => async (streamName, events, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(events, `${baseErr}Events not provided`);
  assert(Array.isArray(events), `${baseErr}Events should be an array`);

  if (events.length === 0) return undefined;

  const transactionWriteSize = options?.transactionWriteSize || 250;
  const expectedVersion = toExpectedVersion(options?.expectedVersion);

  const eventsToWrite = events.map((ev) => client.createJsonEventData(ev.eventId, ev.data, ev.metadata, ev.eventType));
  const connection = await connectionManager.create(config);
  let transaction;
  try {
    transaction = await connection.startTransaction(streamName, expectedVersion, config.credentials);

    // Chunks are written one at a time so the transaction keeps the caller's event order
    for (const chunk of chunkArray(eventsToWrite, transactionWriteSize)) {
      await transaction.write(chunk);
    }

    const result = await transaction.commit();
    debug('', 'Result: %j', result);
    return result;
  } catch (err) {
    if (transaction) await transaction.rollback();
    throw err;
  } finally {
    connection.releaseConnection();
  }
};
