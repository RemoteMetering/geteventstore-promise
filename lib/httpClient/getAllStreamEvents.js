import iterateAllStreamEvents from './iterateAllStreamEvents.js';
import collect from '../utilities/collect.js';

export default (config, httpClient) => {
	const iterate = iterateAllStreamEvents(config, httpClient);
	return (streamName, chunkSize, startPosition, resolveLinkTos, embed) => collect(iterate(streamName, chunkSize, startPosition, resolveLinkTos, embed));
};
