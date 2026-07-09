import collect from '../utilities/collect.js';

export default (iterateAllEvents) => (startPosition, count, direction, resolveLinkTos) => collect(iterateAllEvents(startPosition, count, direction, resolveLinkTos));
