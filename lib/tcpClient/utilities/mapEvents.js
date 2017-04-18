const _ = require('lodash');

module.exports = events => _.chain(events).filter('event').map(ev => {
    const event = ev.event;
    const link = ev.link;

    let mappedEvent = {
        streamId: event.eventStreamId,
        eventId: event.eventId,
        eventNumber: event.eventNumber,
        eventType: event.eventType,
        created: event.created,
        metadata: event.metadata.toString(),
        isJson: event.isJson,
        data: JSON.parse(event.data.toString())
    };

    if (!_.isEmpty(mappedEvent.metadata)) mappedEvent.metadata = JSON.parse(mappedEvent.metadata);

    if (link) {
        mappedEvent.positionStreamId = link.eventStreamId;
        mappedEvent.positionEventId = link.eventId;
        mappedEvent.positionEventNumber = link.eventNumber;
        mappedEvent.positionCreated = link.created;
    }
    return mappedEvent;
}).value();