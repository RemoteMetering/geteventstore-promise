import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:readEvents');
const baseErr = 'Read Events - ';

export default (config, direction) => async (streamName, startPosition, count, resolveLinkTos) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? 'end' : startPosition || 'start';
	count = count || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (count > 4096) {
		console.warn('WARNING: Max event count exceeded. Using the max of 4096');
		count = 4096;
	}

	const connection = await connectionManager.create(config);

	function handleResult(readResult) {
		debug('', 'Result: %j', readResult);
		const result = {};
		result.events = mapEvents(readResult.events);
		return result;
	}

	try {
		const events = [];
		for await (const event of connection.readStream(streamName, { direction: `${direction}s`, maxCount: count, fromRevision: startPosition, resolveLinkTos })) {
			events.push(event);
		}
		return handleResult({ events });
	} finally {
		connection.releaseConnection();
	}
};