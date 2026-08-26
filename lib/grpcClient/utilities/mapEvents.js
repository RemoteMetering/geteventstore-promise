export { default as keepEvent } from '../../utilities/keepEvent.js';

const toEventNumber = (revision) => Number(revision.toNumber ? revision.toNumber() : revision);

const toPayload = (data, isJson) => (isJson || typeof data === 'string' ? data : Buffer.from(data || []).toString());

export const mapEvent = (ev) => {
  const { event, link } = ev;

  // A resolved-link record whose target has been deleted, tombstoned or scavenged arrives
  // with only the link populated. Return it as an unresolved marker so callers can page
  // correctly and detect that a slot existed, instead of silently dropping it.
  if (!event) {
    if (!link) return null;

    const deletedEvent = {
      streamId: link.streamId,
      eventId: link.id,
      eventNumber: toEventNumber(link.revision),
      eventType: link.type,
      created: new Date(link.created / 10000).toISOString(),
      metadata: null,
      isJson: false,
      data: null,
      isResolved: false
    };

    if (link.position) deletedEvent.position = link.position;
    return deletedEvent;
  }

  const mappedEvent = {
    streamId: event.streamId,
    eventId: event.id,
    eventNumber: toEventNumber(event.revision),
    eventType: event.type,
    created: new Date(event.created / 10000).toISOString(),
    metadata: event.metadata,
    isJson: event.isJson,
    data: toPayload(event.data, event.isJson)
  };

  if (event.position) mappedEvent.position = event.position;
  if (mappedEvent.metadata && typeof mappedEvent.metadata === 'string')
    mappedEvent.metadata = JSON.parse(mappedEvent.metadata);

  if (link) {
    mappedEvent.positionStreamId = link.streamId;
    mappedEvent.positionEventId = link.id;
    mappedEvent.positionEventNumber = toEventNumber(link.revision);
    mappedEvent.positionCreated = link.created;
    mappedEvent.commitPosition = ev.commitPosition;
    mappedEvent.positionCausedBy = ev.$causedBy;
    mappedEvent.positionCorrelationId = ev.$correlationId;
  }
  return mappedEvent;
};
