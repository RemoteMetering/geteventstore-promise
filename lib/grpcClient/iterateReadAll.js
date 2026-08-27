import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadAll');
const baseErr = 'Read All - ';

export default (config, direction) =>
  async function* (startPosition, count, resolveLinkTos = true, filter) {
    direction = direction || 'forward';
    startPosition = startPosition === undefined && direction === 'backward' ? 'end' : startPosition || 'start';
    assert(
      (typeof startPosition === 'string' && ['start', 'end'].includes(startPosition)) ||
        typeof startPosition === 'object',
      `${baseErr}'startPosition' not valid. Needs to be an object with 'commit' and 'prepare' or a string of 'start' or 'end'`
    );
    count = clampEventCount(count);

    let _startPosition = startPosition;
    if (startPosition && typeof startPosition === 'object') {
      if (startPosition.commit === undefined || startPosition.prepare === undefined) {
        throw new Error(`${baseErr}'startPosition' not valid. Needs to be an object with 'commit' and 'prepare'`);
      }
      _startPosition = { commit: BigInt(startPosition.commit), prepare: BigInt(startPosition.prepare) };
    }

    const connection = await connectionManager.getOrCreate(config);
    debug('', 'Streaming %s events from $all%s', direction, filter ? ' (filtered)' : '');
    for await (const event of connection.readAll({
      direction: `${direction}s`,
      maxCount: count,
      fromPosition: _startPosition,
      resolveLinkTos,
      filter
    })) {
      const mapped = mapEvent(event);
      if (keepEvent(mapped, config.includeDeleted)) yield mapped;
    }
  };
