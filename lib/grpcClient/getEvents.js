import collect from '../utilities/collect';

export default (iterateEvents) => (streamName, startPosition, count, direction, resolveLinkTos) => collect(iterateEvents(streamName, startPosition, count, direction, resolveLinkTos));
