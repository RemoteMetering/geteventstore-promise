import assert from 'assert';
import clampEventCount from '../utilities/clampEventCount.js';
import readSlice from './utilities/readSlice.js';

const baseErr = 'Get All Stream Events - ';

export default (config) => {
  const read = readSlice(config);

  return async function* (streamName, chunkSize, startPosition, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    chunkSize = clampEventCount(chunkSize, 'event chunk size');

    let position = startPosition || 0;
    while (true) {
      const result = await read(streamName, position, 'forward', chunkSize, resolveLinkTos);
      yield* result.events;

      if (result.isEndOfStream !== false) return;
      position = result.nextEventNumber;
    }
  };
};
