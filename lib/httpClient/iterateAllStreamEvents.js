import assert from 'assert';
import clampEventCount from '../utilities/clampEventCount.js';
import readStreamPage from './utilities/readStreamPage.js';

const baseErr = 'Get All Stream Events - ';

export default (config, httpClient) => {
  const readPage = readStreamPage(config, httpClient);

  return async function* (streamName, chunkSize, startPosition, resolveLinkTos = true, embed = 'body') {
    assert(streamName, `${baseErr}Stream Name not provided`);

    startPosition = startPosition || 0;
    chunkSize = clampEventCount(chunkSize, 'event chunk size');

    while (true) {
      const { data, events } = await readPage(streamName, startPosition, 'forward', chunkSize, resolveLinkTos, embed);
      yield* events;

      if (data.headOfStream === true) return;
      startPosition += chunkSize;
    }
  };
};
