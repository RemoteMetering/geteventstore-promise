import flattenArray from '../utilities/flattenArray';
import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getAllStreamEvents');
const baseErr = 'Get All Stream Events - ';

export default (config) => async (streamName, chunkSize, startPosition, resolveLinkTos) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	chunkSize = chunkSize || 1000;
	if (chunkSize > 4096) {
		console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
		chunkSize = 4096;
	}
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	const connection = await connectionManager.create(config);
	const events = [];
	async function getNextChunk(startPosition) {
		const result = await connection.readStreamEventsForward(streamName, startPosition, chunkSize, resolveLinkTos, config.credentials);
		debug('', 'Result: %j', result);

		if (result.error) {
			throw new Error(result.error);
		}

		events.push(result.events);

		if (result.isEndOfStream === false) {
			return getNextChunk(result.nextEventNumber);
		}
		return mapEvents(flattenArray(events));
	}

	try {
		return await getNextChunk(startPosition || 0);
	} finally {
		connection.releaseConnection();
	}
};