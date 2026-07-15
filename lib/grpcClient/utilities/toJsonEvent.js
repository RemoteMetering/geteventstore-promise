import { jsonEvent } from '@kurrent/kurrentdb-client';

export default (ev) => jsonEvent({
	id: ev.eventId,
	type: ev.eventType,
	data: ev.data,
	metadata: ev.metadata
});
