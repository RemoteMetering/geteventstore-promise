const _ = require('lodash');

module.exports = events => _.chain(events).filter('event').map(ev => {
    const event = ev.event;
    const link = ev.link;

    let mappedEvent = {
        streamId: event.eventStreamId,
        eventNumber: event.eventNumber,
        eventType: event.eventType,
        created: event.created,
        metadata: event.metadata,
        isJson: event.isJson,
        data: JSON.parse(event.data.toString())
    };

    if (link) {
        mappedEvent.positionStreamId = link.eventStreamId;
        mappedEvent.positionEventNumber = link.eventNumber;
    }
    return mappedEvent;
}).value();