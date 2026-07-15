import readStreamPage from './utilities/readStreamPage.js';
import assert from 'assert';

const baseErr = 'Read Events - ';

export default (config, httpClient, direction) => {
	const readPage = readStreamPage(config, httpClient);

	return async (streamName, startPosition, count, resolveLinkTos, embed = 'body') => {
		assert(streamName, `${baseErr}Stream Name not provided`);

		const page = await readPage(streamName, startPosition, direction, count, resolveLinkTos, embed);
		const { data, events } = page;
		data.isEndOfStream = data.headOfStream;
		data.readDirection = page.direction;
		data.fromEventNumber = page.startPosition;
		data.nextEventNumber = !data.headOfStream && events.length > 0 ? events[events.length - 1].eventNumber + (page.direction === 'forward' ? 1 : -1) : 0;
		data.events = events;
		return data;
	};
};
