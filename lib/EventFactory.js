import generateEventId from './utilities/generateEventId';
import assert from 'assert';

export default class EventFactory {
	newEvent(eventType, data, metadata, eventId) {
		assert(eventType);
		assert(data);

		const event = {
			eventId: eventId || generateEventId(),
			eventType,
			data
		};

		if (metadata !== undefined) event.metadata = metadata;
		return event;
	}
}