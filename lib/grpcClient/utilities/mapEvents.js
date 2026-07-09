export const mapEvent = (ev) => {
	const event = ev.event;
	if (!event) return null;

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
};

export default (events) => {
	const mapped = [];
	for (const ev of events) {
		const mappedEvent = mapEvent(ev);
		if (mappedEvent) mapped.push(mappedEvent);
	}
	return mapped;
};
