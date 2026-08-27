import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import mapEvents from './utilities/mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadEvents');
const baseErr = 'Read Events - ';

export default (config, direction) =>
  async function* (streamName, startPosition, count, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    direction = direction || 'forward';
    startPosition = startPosition === undefined && direction === 'backward' ? -1 : startPosition || 0;
    count = clampEventCount(count);

    const connection = await connectionManager.create(config);
    const read = direction === 'forward' ? 'readStreamEventsForward' : 'readStreamEventsBackward';

    try {
      const readResult = await connection[read](streamName, startPosition, count, resolveLinkTos, config.credentials);

      debug('', 'Result: %j', readResult);
      if (readResult.error) throw new Error(readResult.error);

      yield* mapEvents(readResult.events, config.includeDeleted);
    } finally {
      connection.releaseConnection();
    }
  };
