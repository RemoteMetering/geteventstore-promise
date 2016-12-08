var assert = require('assert');
var uuid = require('uuid');

module.exports = {
    NewEvent: function(eventType, data, metadata) {
        assert(eventType);
        assert(data);

        var event = {
            eventId: uuid.v4(),
            eventType: eventType,
            data: data
        }

        if (metadata !== undefined) event.metadata = metadata;
        return event;
    }
};