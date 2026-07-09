import iterateReadAll from './iterateReadAll';
import collect from '../utilities/collect';

export default (config, direction) => {
	const iterate = iterateReadAll(config, direction);
	return async (startPosition, count, resolveLinkTos) => ({ events: await collect(iterate(startPosition, count, resolveLinkTos)) });
};
