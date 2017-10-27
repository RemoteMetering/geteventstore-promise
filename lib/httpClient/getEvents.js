import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getEvents');
const baseErr = 'Get Events - ';

export default (config) => async(streamName, startPosition, length, direction, resolveLinkTos, embed = 'body') => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	length = length || 1000;

	if (length > 4096) {
		console.warn('WARNING: Max event return limit exceeded. Using the max of 4096');
		length = 4096;
	}

	direction = direction || 'forward';
	startPosition = startPosition === undefined && direction === 'backward' ? 'head' : startPosition || 0;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	const options = {
		uri: `${config.baseUrl}/streams/${streamName}/${startPosition}/${direction}/${length}`,
		method: 'GET',
		headers: {
			"Content-Type": "application/vnd.eventstore.events+json",
			"ES-ResolveLinkTos": resolveLinkTos.toString()
		},
		qs: {
			embed
		},
		json: true,
		timeout: config.timeout
	};

	debug('', 'Options: ', options);
	const response = await req(options);
	if (embed === 'body') {
		let totalEntries = response.entries.length;
		for (let i = 0; i < totalEntries; i++) {
			if (response.entries[i].data) response.entries[i].data = JSON.parse(response.entries[i].data);
		}
	}

	if (direction === 'forward') return response.entries.reverse();
	return response.entries;
};