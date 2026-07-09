import iterateReadEvents from './iterateReadEvents';
import collect from '../utilities/collect';

export default (config, direction) => {
	const iterate = iterateReadEvents(config, direction);
	return async (streamName, startPosition, count, resolveLinkTos) => ({ events: await collect(iterate(streamName, startPosition, count, resolveLinkTos)) });
};
