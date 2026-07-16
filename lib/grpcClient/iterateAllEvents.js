export default (iterateAllEventsForward, iterateAllEventsBackward) => (startPosition, count, direction, resolveLinkTos, filter) => {
	const iterateAllEvents = direction === 'backward' ? iterateAllEventsBackward : iterateAllEventsForward;
	return iterateAllEvents(startPosition, count, resolveLinkTos, filter);
};
