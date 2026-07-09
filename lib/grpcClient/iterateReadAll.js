import connectionManager from './connectionManager.js';
import { mapEvent } from './utilities/mapEvents.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:iterateReadAll');
const baseErr = 'Read All - ';

export default (config, direction) => async function* (startPosition, count, resolveLinkTos) {
	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? 'end' : startPosition || 'start';
	assert((typeof startPosition === 'string' && ['start', 'end'].includes(startPosition)) || typeof startPosition === 'object', `${baseErr}'startPosition' not valid. Needs to be an object with 'commit' and 'prepare' or a string of 'start' or 'end'`);
	count = count || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (count > 4096) {
		console.warn('WARNING: Max event count exceeded. Using the max of 4096');
		count = 4096;
	}

	let _startPosition = startPosition;
	if (startPosition && typeof startPosition === 'object') {
		if (startPosition.commit === undefined || startPosition.prepare === undefined) {
			throw new Error(`${baseErr}'startPosition' not valid. Needs to be an object with 'commit' and 'prepare'`);
		}
		_startPosition = { commit: BigInt(startPosition.commit), prepare: BigInt(startPosition.prepare) };
	}

	const connection = await connectionManager.create(config);
	try {
		debug('', 'Streaming %s events from $all', direction);
		for await (const event of connection.readAll({ direction: `${direction}s`, maxCount: count, fromPosition: _startPosition, resolveLinkTos })) {
			const mapped = mapEvent(event);
			if (mapped) yield mapped;
		}
	} finally {
		connection.releaseConnection();
	}
};
