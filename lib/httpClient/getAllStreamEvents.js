import flattenArray from '../utilities/flattenArray';
import mapEvents from './utilities/mapEvents';
import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:getAllStreamEvents');
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

export default (config) => async (streamName, chunkSize, startPosition, resolveLinkTos, embed = 'body') => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	startPosition = startPosition || 0;
	chunkSize = chunkSize || 1000;
	resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

	if (chunkSize > 4096) {
		console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
		chunkSize = 4096;
	}

	const events = [];
	const getNextChunk = async () => {
		const options = buildOptions(config, streamName, startPosition, chunkSize, resolveLinkTos, embed);

		const response = await axios(options);
		debug('', 'Result: %j', response.data);

		if (embed === 'body') {
			const totalEntries = response.data.entries.length;
			for (let i = 0; i < totalEntries; i++) {
				if (response.data.entries[i].data) response.data.entries[i].data = JSON.parse(response.data.entries[i].data);
			}
		}

		events.push(response.data.entries.reverse());

		if (response.data.headOfStream === true) {
			return mapEvents(flattenArray(events));
		}

		startPosition += chunkSize;
		return getNextChunk();
	};

	return getNextChunk();
};