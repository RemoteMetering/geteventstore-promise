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
		let hasNewEvents = false;
		for await (const event of connection.readStream(streamName, { direction: 'forwards', maxCount: chunkSize, fromRevision: startPosition, resolveLinkTos })) {
			events.push(event);
			hasNewEvents = true;
		}

		if (hasNewEvents) {
			return getNextChunk(events[events.length - 1].event.revision + 1n);
		}
		return mapEvents(flattenArray(events));
	}

	try {
		return await getNextChunk(startPosition || 'start');
	} finally {
		connection.releaseConnection();
	}
};