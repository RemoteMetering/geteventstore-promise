import mapEvents from './utilities/mapEvents.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadEvents');
const baseErr = 'Read Events - ';

export default (config, httpClient, direction) => async function* (streamName, startPosition, count, resolveLinkTos, embed = 'body') {
	assert(streamName, `${baseErr}Stream Name not provided`);

	count = count || 1000;

	if (count > 4096) {
		console.warn('WARNING: Max event count exceeded. Using the max of 4096');
		count = 4096;
	}

	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? 'head' : startPosition || 0;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	const options = {
		url: `${config.baseUrl}/streams/${streamName}/${startPosition}/${direction}/${count}`,
		method: 'GET',
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json",
			"ES-ResolveLinkTos": resolveLinkTos.toString()
		},
		params: {
			embed
		},
		timeout: config.timeout
	};

	debug('', 'Options: ', options);
	const response = await httpClient(options);

	if (embed === 'body') {
		for (const entry of response.data.entries) {
			if (entry.data) entry.data = JSON.parse(entry.data);
		}
	}

	const entries = direction === 'forward' ? response.data.entries.reverse() : response.data.entries;
	for (const event of mapEvents(entries)) {
		yield event;
	}
};
