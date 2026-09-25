import { safePosition, toPlainJson } from './jsonSafe.js';

export { default as keepEvent } from '../../utilities/keepEvent.js';

const TICKS_PER_MILLISECOND = 10000n;

const toEventNumber = (revision) => Number(revision.toNumber ? revision.toNumber() : revision);

const toPayload = (data, isJson) => (isJson || typeof data === 'string' ? data : Buffer.from(data || []).toString());

const toMetadataObject = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) ?? {};
    } catch {
      return {};
    }
  }
  if (ArrayBuffer.isView(metadata)) return {};
  return typeof metadata === 'object' ? metadata : {};
};

export const toCreated = (created) => {
  if (created == null) return undefined;
  if (created instanceof Date) return created.toISOString();
  const ticks = typeof created === 'bigint' ? created : BigInt(Math.trunc(Number(created)));
  return new Date(Number(ticks / TICKS_PER_MILLISECOND)).toISOString();
};

// position and commitPosition are BigInt, which JSON.stringify cannot serialise.
function mappedEventToJson() {
  const plain = { ...this };
  if (typeof plain.commitPosition === 'bigint') plain.commitPosition = String(plain.commitPosition);
  if (plain.position) plain.position = toPlainJson(plain.position);
  return plain;
}

const attachToJson = (mappedEvent) =>
  Object.defineProperty(mappedEvent, 'toJSON', { value: mappedEventToJson, configurable: true, writable: true });

const toEventMetadata = (metadata) => {
  if (typeof metadata !== 'string') return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return metadata;
  }
};

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
      created: toCreated(link.created),
      metadata: null,
      isJson: false,
      data: null,
      isResolved: false
    };

    if (link.position) deletedEvent.position = safePosition(link.position);
    return attachToJson(deletedEvent);
  }

  const mappedEvent = {
    streamId: event.streamId,
    eventId: event.id,
    eventNumber: toEventNumber(event.revision),
    eventType: event.type,
    created: toCreated(event.created),
    metadata: event.metadata,
    isJson: event.isJson,
    data: toPayload(event.data, event.isJson)
  };

  if (event.position) mappedEvent.position = safePosition(event.position);
  if (mappedEvent.metadata) mappedEvent.metadata = toEventMetadata(mappedEvent.metadata);

  if (link) {
    mappedEvent.positionStreamId = link.streamId;
    mappedEvent.positionEventId = link.id;
    mappedEvent.positionEventNumber = toEventNumber(link.revision);
    mappedEvent.positionCreated = toCreated(link.created);
    mappedEvent.commitPosition = ev.commitPosition;
    const linkMetadata = toMetadataObject(link.metadata);
    mappedEvent.positionCausedBy = linkMetadata.$causedBy;
    mappedEvent.positionCorrelationId = linkMetadata.$correlationId;
  }
  return attachToJson(mappedEvent);
};
