import iterateReadAll from './iterateReadAll.js';
import collect from '../utilities/collect.js';

export default (config, direction) => {
	const iterate = iterateReadAll(config, direction);
	return async (startPosition, count, resolveLinkTos) => ({ events: await collect(iterate(startPosition, count, resolveLinkTos)) });
};
