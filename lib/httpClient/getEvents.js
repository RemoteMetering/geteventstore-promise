import collect from '../utilities/collect';

export default (iterateEvents) => (streamName, startPosition, count, direction, resolveLinkTos, embed) => collect(iterateEvents(streamName, startPosition, count, direction, resolveLinkTos, embed));
