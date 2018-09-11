export default (events) => events.filter(ev => ev.event).map(ev => {
	const event = ev.event;
	const link = ev.link;

	const mappedEvent = {
		streamId: event.eventStreamId,
		eventId: event.eventId,
		eventNumber: event.eventNumber.toNumber ? event.eventNumber.toNumber() : event.eventNumber,
		eventType: event.eventType,
		created: event.created.toISOString(),
		metadata: event.metadata.toString(),
		isJson: event.isJson,
		data: JSON.parse(event.data.toString())
	};

	if (mappedEvent.metadata) mappedEvent.metadata = JSON.parse(mappedEvent.metadata);

	if (link) {
		mappedEvent.positionStreamId = link.eventStreamId;
		mappedEvent.positionEventId = link.eventId;
		mappedEvent.positionEventNumber = link.eventNumber.toNumber ? link.eventNumber.toNumber() : link.eventNumber;
		mappedEvent.positionCreated = link.created;
	}
	return mappedEvent;
});