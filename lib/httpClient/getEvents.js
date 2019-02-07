import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:getEvents');
const baseErr = 'Get Events - ';

export default (config) => async (streamName, startPosition, count, direction, resolveLinkTos, embed = 'body') => {
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
	const response = await axios(options);
	if (embed === 'body') {
		const totalEntries = response.data.entries.length;
		for (let i = 0; i < totalEntries; i++) {
			if (response.data.entries[i].data) response.data.entries[i].data = JSON.parse(response.data.entries[i].data);
		}
	}

	if (direction === 'forward') return mapEvents(response.data.entries.reverse());
	return mapEvents(response.data.entries);
};