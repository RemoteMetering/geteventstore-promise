import assert from 'assert';

const baseErr = 'Get Events by Type - ';

export default (getEvents) => async (streamName, eventTypes, startPosition, count, direction, resolveLinkTos) => {
	assert(eventTypes, `${baseErr}Event Types not provided`);

	const events = await getEvents(streamName, startPosition, count, direction, resolveLinkTos);
	return events.filter(event => eventTypes.includes(event.eventType));
};