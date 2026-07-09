import collect from '../utilities/collect.js';

export default (iterateEventsByType) => (streamName, eventTypes, startPosition, count, direction, resolveLinkTos) => collect(iterateEventsByType(streamName, eventTypes, startPosition, count, direction, resolveLinkTos));
