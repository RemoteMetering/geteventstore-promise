export default (iterateEventsForward, iterateEventsBackward) =>
  (streamName, startPosition, count, direction, ...rest) => {
    const iterateEvents = direction === 'backward' ? iterateEventsBackward : iterateEventsForward;
    return iterateEvents(streamName, startPosition, count, ...rest);
  };
