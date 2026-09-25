import assert from 'assert';
import readSlice from './utilities/readSlice.js';

const baseErr = 'Read Events - ';

export default (config, direction) => {
  const read = readSlice(config);

  return async function* (streamName, startPosition, count, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    const { events } = await read(streamName, startPosition, direction, count, resolveLinkTos);
    yield* events;
  };
};
