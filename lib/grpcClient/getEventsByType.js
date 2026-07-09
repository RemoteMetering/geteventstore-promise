import collect from '../utilities/collect';

export default (iterateEventsByType) => (streamName, eventTypes, startPosition, count, direction, resolveLinkTos) => collect(iterateEventsByType(streamName, eventTypes, startPosition, count, direction, resolveLinkTos));
