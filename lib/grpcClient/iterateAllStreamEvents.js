import assert from 'assert';
import clampEventCount from '../utilities/clampEventCount.js';
import { iterateReadEventsWithState } from './iterateReadEvents.js';

const baseErr = 'Get All Stream Events - ';

export default (config) => {
  const readForward = iterateReadEventsWithState(config, 'forward');

  return async function* (streamName, chunkSize, startPosition, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    chunkSize = clampEventCount(chunkSize, 'event chunk size');

    let fromRevision = startPosition;
    while (true) {
      const readState = {};
      yield* readForward(streamName, fromRevision, chunkSize, resolveLinkTos, readState);

      if (readState.lastPosition === undefined || readState.rawCount < readState.requestedCount) return;
      fromRevision = BigInt(readState.lastPosition) + 1n;
    }
  };
};
