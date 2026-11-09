import assert from 'assert';
import readStreamPage from './utilities/readStreamPage.js';

const baseErr = 'Read Events - ';

export default (config, httpClient, direction) => {
  const readPage = readStreamPage(config, httpClient);

  return async (streamName, startPosition, count, resolveLinkTos, embed = 'body') => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    const page = await readPage(streamName, startPosition, direction, count, resolveLinkTos, embed);
    const { data, events } = page;
    const forward = page.direction === 'forward';
    const last = events[events.length - 1];
    const lastPosition = last ? (last.positionEventNumber ?? last.eventNumber) : undefined;

    data.isEndOfStream = forward
      ? data.headOfStream
      : lastPosition === undefined || lastPosition <= 0 || events.length < page.count;
    data.readDirection = page.direction;
    data.fromEventNumber = page.startPosition;
    data.nextEventNumber = !data.isEndOfStream && last ? lastPosition + (forward ? 1 : -1) : 0;
    data.events = events;
    return data;
  };
};
