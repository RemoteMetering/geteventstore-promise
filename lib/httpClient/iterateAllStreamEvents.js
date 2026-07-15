import readStreamPage from './utilities/readStreamPage.js';
import assert from 'assert';

const baseErr = 'Get All Stream Events - ';

export default (config, httpClient) => {
	const readPage = readStreamPage(config, httpClient);

	return async function* (streamName, chunkSize, startPosition, resolveLinkTos, embed = 'body') {
		assert(streamName, `${baseErr}Stream Name not provided`);

		startPosition = startPosition || 0;
		chunkSize = chunkSize || 1000;
		resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

		if (chunkSize > 4096) {
			console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
			chunkSize = 4096;
		}

		while (true) {
			const { data, events } = await readPage(streamName, startPosition, 'forward', chunkSize, resolveLinkTos, embed);
			yield* events;

			if (data.headOfStream === true) return;
			startPosition += chunkSize;
		}
	};
};
