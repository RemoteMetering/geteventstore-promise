const assert = require('assert');
const uuid = require('uuid');

module.exports = {
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