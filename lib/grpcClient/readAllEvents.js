export default (readAllForward, readAllBackward) => async (startPosition, count, direction, resolveLinkTos) => {
	const readAll = direction === 'backward' ? readAllBackward : readAllForward;
	return (await readAll(startPosition, count, resolveLinkTos)).events;
};