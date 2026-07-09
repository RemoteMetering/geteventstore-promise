import collect from '../utilities/collect.js';

export default (iterateEvents) => (streamName, startPosition, count, direction, resolveLinkTos, embed) => collect(iterateEvents(streamName, startPosition, count, direction, resolveLinkTos, embed));
