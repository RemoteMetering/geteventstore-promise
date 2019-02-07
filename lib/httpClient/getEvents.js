export default (readEventsForward, readEventsBackward) => async (streamName, startPosition, count, direction, resolveLinkTos, embed = 'body') => {
	const readEvents = direction === 'backward' ? readEventsBackward : readEventsForward;
	return (await readEvents(streamName, startPosition, count, resolveLinkTos, embed)).events;
};