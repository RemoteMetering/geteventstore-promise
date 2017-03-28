var _ = require('lodash');

module.exports = events => _.map(events, ev => {
    var event = ev.event;
    var link = ev.link;

    let mappedEvent = {
        data: JSON.parse(event.data.toString()),
        eventStreamId: event.eventStreamId,
        eventNumber: event.eventNumber,
        eventType: event.eventType,
        created: event.created,
        metadata: event.metadata,
        isJson: event.isJson
    };

    if (link) {
        mappedEvent.positionStreamId = link.eventStreamId;
        mappedEvent.positionEventNumber = link.eventNumber;
    }
    return mappedEvent;
});