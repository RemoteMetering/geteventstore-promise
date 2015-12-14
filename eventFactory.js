module.exports = {
    newEvent: function(eventType, data, metadata) {
        assert.ok(eventType);
        assert.ok(data);

        var event = {
            eventId: uuid.v4(),
            eventType: eventType,
            data: data
        }

        if (metadata !== undefined) event.metadata = metadata;
        return event;
    };
};