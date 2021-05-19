import connectionManager from './connectionManager';
import chunkArray from '../utilities/chunkArray';
import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => async (streamName, events, options) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(events, `${baseErr}Events not provided`);
	assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

	if (events.length === 0) return;

	options = options || {};
	options.transactionWriteSize = options.transactionWriteSize || 250;
	options.expectedVersion = !Number.isInteger(options.expectedVersion) ? -2 : options.expectedVersion;

	const eventsToWrite = events.map(ev => client.createJsonEventData(ev.eventId, ev.data, ev.metadata, ev.eventType));
	const connection = await connectionManager.create(config);
	let transaction;
	try {
		transaction = await connection.startTransaction(streamName, options.expectedVersion, config.credentials);

		const eventChunks = chunkArray(eventsToWrite, options.transactionWriteSize);
		for (let i = 0; i < eventChunks.length; i++) {
			await transaction.write(eventChunks[i]);
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