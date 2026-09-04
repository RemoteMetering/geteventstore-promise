import collect from '../utilities/collect.js';

export default (iterate, direction) => async (streamName, startPosition, count, resolveLinkTos) => {
  const readState = {};
  const events = await collect(iterate(streamName, startPosition, count, resolveLinkTos, readState));

  // TODO: This has been reported to the kurrent engineering team, follow up
  // gRPC reports no head-of-stream flag, so a batch shorter than the requested count is the only
  // signal that the read ran out of events.
  const isEndOfStream = readState.rawCount < readState.requestedCount;
  const hasPosition = readState.lastPosition !== undefined;

  return {
    events,
    isEndOfStream,
    readDirection: direction,
    fromEventNumber: readState.startPosition,
    nextEventNumber:
      !isEndOfStream && hasPosition ? Number(readState.lastPosition) + (direction === 'backward' ? -1 : 1) : 0
  };
};
