const _ = require('lodash');

module.exports = events => _.map(events, ev => {
    const event = ev.event;
    const link = ev.link;

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