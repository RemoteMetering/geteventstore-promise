export default (iterateEventsForward, iterateEventsBackward) => (streamName, startPosition, count, direction, resolveLinkTos) => {
	const iterateEvents = direction === 'backward' ? iterateEventsBackward : iterateEventsForward;
	return iterateEvents(streamName, startPosition, count, resolveLinkTos);
};
