import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:readAll');
const baseErr = 'Read All - ';

export default (config, direction) => async (startPosition, count, resolveLinkTos) => {
	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? 'end' : startPosition || 'start';
	assert((typeof startPosition === 'string' && ['start', 'end'].includes(startPosition)) || typeof startPosition === 'object', `${baseErr}'startPosition' not valid. Needs to be an object with 'commit' and 'prepare' or a string of 'start' or 'end'`);
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
		for await (const event of connection.readAll({ direction: `${direction}s`, maxCount: count, fromPosition: startPosition, resolveLinkTos })) {
			events.push(event);
		}
		return handleResult({ events });
	} finally {
		connection.releaseConnection();
	}
};