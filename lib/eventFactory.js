import assert from 'assert';
import uuid from 'uuid';

export default {
	NewEvent(eventType, data, metadata, eventId) {
		assert(eventType);
		assert(data);

		const event = {
			eventId: eventId || uuid.v4(),
			eventType,
			data
		};

		if (metadata !== undefined) event.metadata = metadata;
		return event;
	}
};