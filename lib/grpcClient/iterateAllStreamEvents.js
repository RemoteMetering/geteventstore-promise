import connectionManager from './connectionManager.js';
import { mapEvent } from './utilities/mapEvents.js';
import assert from 'assert';

const baseErr = 'Get All Stream Events - ';

export default (config) => async function* (streamName, chunkSize, startPosition, resolveLinkTos) {
	assert(streamName, `${baseErr}Stream Name not provided`);

	chunkSize = chunkSize || 1000;
	if (chunkSize > 4096) {
		console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
		chunkSize = 4096;
	}
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	const connection = await connectionManager.create(config);
	try {
		let fromRevision = startPosition || 'start';
		while (true) {
			let hasNewEvents = false;
			let lastRevision;
			const revision = typeof fromRevision === 'bigint' ? fromRevision : !isNaN(fromRevision) ? BigInt(fromRevision) : fromRevision;
			for await (const event of connection.readStream(streamName, { direction: 'forwards', maxCount: chunkSize, fromRevision: revision, resolveLinkTos })) {
				hasNewEvents = true;
				lastRevision = event.event.revision;
				const mapped = mapEvent(event);
				if (mapped) yield mapped;
			}

			if (!hasNewEvents) return;
			fromRevision = lastRevision + 1n;
		}
	} finally {
		connection.releaseConnection();
	}
};
