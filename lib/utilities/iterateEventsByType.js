import assert from 'assert';

const baseErr = 'Get Events by Type - ';

export default (iterateEvents) => async function* (streamName, eventTypes, startPosition, count, direction, ...rest) {
	assert(eventTypes, `${baseErr}Event Types not provided`);

	const typeSet = new Set(eventTypes);
	for await (const event of iterateEvents(streamName, startPosition, count, direction, ...rest)) {
		if (typeSet.has(event.eventType)) yield event;
	}
};
