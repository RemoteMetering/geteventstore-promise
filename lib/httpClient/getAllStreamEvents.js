import iterateAllStreamEvents from './iterateAllStreamEvents';
import collect from '../utilities/collect';

export default (config, httpClient) => {
	const iterate = iterateAllStreamEvents(config, httpClient);
	return (streamName, chunkSize, startPosition, resolveLinkTos, embed) => collect(iterate(streamName, chunkSize, startPosition, resolveLinkTos, embed));
};
