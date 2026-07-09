import iterateAllStreamEvents from './iterateAllStreamEvents.js';
import collect from '../utilities/collect.js';

export default (config) => {
	const iterate = iterateAllStreamEvents(config);
	return (streamName, chunkSize, startPosition, resolveLinkTos) => collect(iterate(streamName, chunkSize, startPosition, resolveLinkTos));
};
