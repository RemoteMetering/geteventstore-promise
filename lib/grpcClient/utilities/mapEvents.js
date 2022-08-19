export default (events) => events.filter(ev => ev.event).map(ev => {
	const event = ev.event;
	const link = ev.link;

	const mappedEvent = {
		streamId: event.streamId,
		eventId: event.id,
		eventNumber: event.revision.toNumber ? event.revision.toNumber() : event.revision,
		eventType: event.type,
		created: new Date(event.created / 10000).toISOString(),
		metadata: event.metadata,
		isJson: event.isJson,
		data: event.data
	};

	if (event.position) mappedEvent.position = event.position;
	if (mappedEvent.metadata && typeof mappedEvent.metadata === 'string') mappedEvent.metadata = JSON.parse(mappedEvent.metadata);

	if (link) {
		mappedEvent.positionStreamId = link.streamId;
		mappedEvent.positionEventId = link.id;
		mappedEvent.positionEventNumber = link.revision.toNumber ? link.revision.toNumber() : link.revision;
		mappedEvent.positionCreated = link.created;
		mappedEvent.commitPosition = ev.commitPosition;
		mappedEvent.positionCausedBy = ev.$causedBy;
		mappedEvent.positionCorrelationId = ev.$correlationId;
	}
	return mappedEvent;
});