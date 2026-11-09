import debugModule from 'debug';
import connectionManager from '../connectionManager.js';
import clampEventCount from '../../utilities/clampEventCount.js';
import mapEvents from './mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:readSlice');

export default (config) =>
  async (streamName, startPosition, direction, count, resolveLinkTos = true, countLabel) => {
    direction = direction || 'forward';
    startPosition = startPosition === undefined && direction === 'backward' ? -1 : startPosition || 0;
    count = clampEventCount(count, countLabel);

    const connection = await connectionManager.create(config);
    const read = direction === 'forward' ? 'readStreamEventsForward' : 'readStreamEventsBackward';

    let readResult;
    try {
      readResult = await connection[read](streamName, startPosition, count, resolveLinkTos, config.credentials);
    } finally {
      connection.releaseConnection();
    }

    debug('', 'Result: %j', readResult);
    if (readResult.error) throw new Error(readResult.error);

    const { events, ...rest } = readResult;
    return { ...rest, events: mapEvents(events, config.includeDeleted) };
  };
