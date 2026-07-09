import connectionManager from './connectionManager.js';
import mapEvents from './utilities/mapEvents.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:iterateReadEvents');
const baseErr = 'Read Events - ';

export default (config, direction) => async function* (streamName, startPosition, count, resolveLinkTos) {
	assert(streamName, `${baseErr}Stream Name not provided`);

	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? -1 : startPosition || 0;
	count = count || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (count > 4096) {
		console.warn('WARNING: Max event count exceeded. Using the max of 4096');
		count = 4096;
	}

	const connection = await connectionManager.create(config);
	try {
		const readResult = direction === 'forward'
			? await connection.readStreamEventsForward(streamName, startPosition, count, resolveLinkTos, config.credentials)
			: await connection.readStreamEventsBackward(streamName, startPosition, count, resolveLinkTos, config.credentials);

		debug('', 'Result: %j', readResult);
		if (readResult.error) throw new Error(readResult.error);

		for (const event of mapEvents(readResult.events)) {
			yield event;
		}
	} finally {
		connection.releaseConnection();
	}
};
