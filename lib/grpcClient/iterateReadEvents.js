import connectionManager from './connectionManager.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadEvents');
const baseErr = 'Read Events - ';

export default (config, direction) => async function* (streamName, startPosition, count, resolveLinkTos) {
	assert(streamName, `${baseErr}Stream Name not provided`);

	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? 'end' : isNaN(startPosition) ? 'start' : startPosition;
	count = count || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (count > 4096) {
		console.warn('WARNING: Max event count exceeded. Using the max of 4096');
		count = 4096;
	}

	const connection = await connectionManager.getOrCreate(config);
	debug('', 'Streaming %s events from %s', direction, streamName);
	for await (const event of connection.readStream(streamName, { direction: `${direction}s`, maxCount: count, fromRevision: !isNaN(startPosition) ? BigInt(startPosition) : startPosition, resolveLinkTos })) {
		const mapped = mapEvent(event);
		if (keepEvent(mapped, config.includeDeleted)) yield mapped;
	}
};
