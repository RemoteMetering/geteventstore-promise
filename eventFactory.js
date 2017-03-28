var assert = require('assert');
var uuid = require('uuid');

module.exports = {
    NewEvent(eventType, data, metadata, eventId) {
        assert(eventType);
        assert(data);

        var event = {
            eventId: eventId || uuid.v4(),
            eventType: eventType,
            data: data
        };

        if (metadata !== undefined) event.metadata = metadata;
        return event;
    }
};