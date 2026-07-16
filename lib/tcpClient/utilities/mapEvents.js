export default (events, includeDeleted) => events.reduce((mapped, ev) => {
	const event = ev.event;
	const link = ev.link;

	// A resolved-link record whose target has been deleted, tombstoned or scavenged arrives
	// with only the link populated. Surface it as an unresolved marker (unless the caller opted
	// out) so batch reads keep their true size instead of silently shrinking.
	if (!event) {
		if (!link || includeDeleted === false) return mapped;

		mapped.push({
			streamId: link.eventStreamId,
			eventId: link.eventId,
			eventNumber: link.eventNumber.toNumber ? link.eventNumber.toNumber() : link.eventNumber,
			eventType: link.eventType,
			created: link.created.toISOString(),
			metadata: null,
			isJson: false,
			data: null,
			isResolved: false
		});
		return mapped;
	}

	const mappedEvent = {
		streamId: event.eventStreamId,
		eventId: event.eventId,
		eventNumber: event.eventNumber.toNumber ? event.eventNumber.toNumber() : event.eventNumber,
		eventType: event.eventType,
		created: event.created.toISOString(),
		metadata: event.metadata.toString(),
		isJson: event.isJson,
		data: event.isJson ? JSON.parse(event.data.toString()) : event.data.toString()
	};

	if (mappedEvent.metadata) mappedEvent.metadata = JSON.parse(mappedEvent.metadata);

	if (link) {
		mappedEvent.positionStreamId = link.eventStreamId;
		mappedEvent.positionEventId = link.eventId;
		mappedEvent.positionEventNumber = link.eventNumber.toNumber ? link.eventNumber.toNumber() : link.eventNumber;
		mappedEvent.positionCreated = link.created;
	}

	mapped.push(mappedEvent);
	return mapped;
}, []);
