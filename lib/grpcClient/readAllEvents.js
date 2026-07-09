import collect from '../utilities/collect';

export default (iterateAllEvents) => (startPosition, count, direction, resolveLinkTos) => collect(iterateAllEvents(startPosition, count, direction, resolveLinkTos));
