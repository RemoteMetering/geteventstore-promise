import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:readEvents');
const baseErr = 'Read Events - ';

export default (config, httpClient, direction) => async (streamName, startPosition, count, resolveLinkTos, embed = 'body') => {
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
		const totalEntries = response.data.entries.length;
		for (let i = 0; i < totalEntries; i++) {
			if (response.data.entries[i].data) response.data.entries[i].data = JSON.parse(response.data.entries[i].data);
		}
	}

	const mappedEvents = mapEvents(direction === 'forward' ? response.data.entries.reverse() : response.data.entries);
	delete response.data.entries;
	response.data.isEndOfStream = response.data.headOfStream;
	response.data.readDirection = direction;
	response.data.fromEventNumber = startPosition;
	response.data.nextEventNumber = !response.data.headOfStream && mappedEvents.length > 0 ? mappedEvents[mappedEvents.length - 1].eventNumber + (direction === 'forward' ? 1 : -1) : 0;
	response.data.events = mappedEvents;
	return response.data;
};