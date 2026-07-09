import mapEvents from './utilities/mapEvents';
import assert from 'assert';

const baseErr = 'Get All Stream Events - ';

const buildOptions = (config, streamName, startPosition, chunkSize, resolveLinkTos, embed) => ({
	url: `${config.baseUrl}/streams/${streamName}/${startPosition}/forward/${chunkSize}`,
	method: 'GET',
	headers: {
		"Content-Type": "application/vnd.eventstore.events+json",
		"ES-ResolveLinkTos": resolveLinkTos.toString()
	},
	params: {
		embed
	},
	timeout: config.timeout
});

export default (config, httpClient) => async function* (streamName, chunkSize, startPosition, resolveLinkTos, embed = 'body') {
	assert(streamName, `${baseErr}Stream Name not provided`);

	startPosition = startPosition || 0;
	chunkSize = chunkSize || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (chunkSize > 4096) {
		console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
		chunkSize = 4096;
	}

	while (true) {
		const options = buildOptions(config, streamName, startPosition, chunkSize, resolveLinkTos, embed);
		const response = await httpClient(options);

		if (embed === 'body') {
			for (const entry of response.data.entries) {
				if (entry.data) entry.data = JSON.parse(entry.data);
			}
		}

		for (const event of mapEvents(response.data.entries.reverse())) {
			yield event;
		}

		if (response.data.headOfStream === true) return;
		startPosition += chunkSize;
	}
};
