import connectionManager from './connectionManager.js';
import { jsonEvent } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:multiStreamWrite');
const baseErr = 'Multi Stream Write - ';

export default (config) => async (writes) => {
	assert(writes, `${baseErr}Writes not provided`);
	assert.equal(true, writes.constructor === Array, `${baseErr}Writes should be an array`);

	if (writes.length === 0) return;

	const requests = writes.map((write, index) => {
		assert(write.streamName, `${baseErr}Stream Name not provided for write at index ${index}`);
		assert(write.events, `${baseErr}Events not provided for write at index ${index}`);
		assert.equal(true, write.events.constructor === Array, `${baseErr}Events should be an array for write at index ${index}`);

		const expectedState = [null, undefined, -2].includes(write.expectedVersion) ? 'any' : write.expectedVersion;

		return {
			streamName: write.streamName,
			expectedState,
			events: write.events.map(ev => jsonEvent({
				id: ev.eventId,
				type: ev.eventType,
				data: ev.data,
				metadata: ev.metadata
			}))
		};
	});

	const connection = await connectionManager.create(config);
	try {
		const result = await connection.multiStreamAppend(requests);
		debug('', 'Result: %j', result);
		return result;
	} finally {
		connection.releaseConnection();
	}
};
