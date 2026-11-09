import debugModule from 'debug';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import { toAllPosition } from './utilities/positions.js';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadAll');
const baseErr = 'Read All - ';

export default (config, direction) =>
  async function* (startPosition, count, resolveLinkTos = false, filter) {
    direction = direction || 'forward';
    const fromPosition =
      startPosition == null ? (direction === 'backward' ? 'end' : 'start') : toAllPosition(startPosition, baseErr);
    count = clampEventCount(count);

    const connection = await connectionManager.getOrCreate(config);
    debug('', 'Streaming %s events from $all%s', direction, filter ? ' (filtered)' : '');
    for await (const event of connection.readAll({
      direction: `${direction}s`,
      maxCount: count,
      fromPosition,
      resolveLinkTos,
      filter
    })) {
      const mapped = mapEvent(event);
      if (keepEvent(mapped, config.includeDeleted)) yield mapped;
    }
  };
