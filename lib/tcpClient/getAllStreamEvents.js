import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:getAllStreamEvents');
const baseErr = 'Get All Stream Events - ';

export default (config) => async(streamName, chunkSize, startPosition, resolveLinkTos) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	chunkSize = chunkSize || 1000;
	if (chunkSize > 4096) {
		console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
		chunkSize = 4096;
	}
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	const connection = await connectionManager.create(config);
	let events = [];

	async function getNextChunk(startPosition) {
		const result = await connection.readStreamEventsForward(streamName, startPosition, chunkSize, resolveLinkTos, config.credentials);
		debug('', 'Result: %j', result);

		if (!_.isEmpty(result.error)) throw new Error(result.error);

		events.push(mapEvents(result.events));

		if (result.isEndOfStream === false) {
			return getNextChunk(result.nextEventNumber);
		} else {
			events = _.flatten(events);
			return events;
		}
	}
	return getNextChunk(startPosition || 0);
};