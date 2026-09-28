import assert from 'assert';
import readStreamPage from './utilities/readStreamPage.js';

const baseErr = 'Read Events - ';

export default (config, httpClient, direction) => {
  const readPage = readStreamPage(config, httpClient);

  return async function* (streamName, startPosition, count, resolveLinkTos, embed = 'body') {
    assert(streamName, `${baseErr}Stream Name not provided`);

    const { events } = await readPage(streamName, startPosition, direction, count, resolveLinkTos, embed);
    yield* events;
  };
};
