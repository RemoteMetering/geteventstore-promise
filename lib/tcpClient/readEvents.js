import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import mapEvents from './utilities/mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:readEvents');
const baseErr = 'Read Events - ';

export default (config, direction) => async (streamName, startPosition, count, resolveLinkTos) => {
  assert(streamName, `${baseErr}Stream Name not provided`);

  direction = direction || 'forward';
  startPosition = startPosition === undefined && direction === 'backward' ? -1 : startPosition || 0;
  count = count || 1000;
  resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

  if (count > 4096) {
    console.warn('WARNING: Max event count exceeded. Using the max of 4096');
    count = 4096;
  }

  const connection = await connectionManager.create(config);

  function handleResult(readResult) {
    debug('', 'Result: %j', readResult);
    if (readResult.error) throw new Error(readResult.error);

    const result = {};
    for (const key of Object.keys(readResult)) {
      if (key !== 'events') result[key] = readResult[key];
    }
    result.events = mapEvents(readResult.events, config.includeDeleted);
    return result;
  }

  try {
    if (direction === 'forward')
      return await connection
        .readStreamEventsForward(streamName, startPosition, count, resolveLinkTos, config.credentials)
        .then(handleResult);
    return await connection
      .readStreamEventsBackward(streamName, startPosition, count, resolveLinkTos, config.credentials)
      .then(handleResult);
  } finally {
    connection.releaseConnection();
  }
};
