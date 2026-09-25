import assert from 'assert';

const baseErr = 'Get Events by Type - ';

export default (iterateEvents) =>
  async function* (streamName, eventTypes, startPosition, count, direction, ...rest) {
    assert(eventTypes, `${baseErr}Event Types not provided`);
    const types = typeof eventTypes === 'string' ? [eventTypes] : eventTypes;
    assert(Array.isArray(types), `${baseErr}Event Types must be an array or a string`);

    const typeSet = new Set(types);
    for await (const event of iterateEvents(streamName, startPosition, count, direction, ...rest)) {
      if (typeSet.has(event.eventType)) yield event;
    }
  };
