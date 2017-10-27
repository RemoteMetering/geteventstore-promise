import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:getAllStreamEvents');
const baseErr = 'Get All Stream Events - ';

const buildOptions = (config, streamName, startPosition, chunkSize, resolveLinkTos, embed) => ({
	uri: `${config.baseUrl}/streams/${streamName}/${startPosition}/forward/${chunkSize}`,
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
});

export default (config) => async(streamName, chunkSize, startPosition, resolveLinkTos, embed = 'body') => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	startPosition = startPosition || 0;
	chunkSize = chunkSize || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (chunkSize > 4096) {
		console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
		chunkSize = 4096;
	}

	let events = [];

	let getNextChunk = async() => {
		const options = buildOptions(config, streamName, startPosition, chunkSize, resolveLinkTos, embed);

		const response = await req(options);
		debug('', 'Result: %j', response);

		if (embed === 'body') {
			let totalEntries = response.entries.length;
			for (let i = 0; i < totalEntries; i++) {
				if (response.entries[i].data) response.entries[i].data = JSON.parse(response.entries[i].data);
			}
		}

		events.push(response.entries.reverse());

		if (response.headOfStream === true) {
			events = _.flatten(events);
			return events;
		}

		startPosition += chunkSize;
		return getNextChunk();
	};

	return getNextChunk();
};