import iterateAllStreamEvents from './iterateAllStreamEvents';
import collect from '../utilities/collect';

export default (config) => {
	const iterate = iterateAllStreamEvents(config);
	return (streamName, chunkSize, startPosition, resolveLinkTos) => collect(iterate(streamName, chunkSize, startPosition, resolveLinkTos));
};
