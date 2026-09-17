import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import positionOf from './utilities/positionOf.js';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadEvents');
const baseErr = 'Read Events - ';

export default (config, direction) =>
  async function* (streamName, startPosition, count, resolveLinkTos = true, readState) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    direction = direction || 'forward';
    if (startPosition === undefined && direction === 'backward') {
      startPosition = 'end';
    } else if (Number.isNaN(Number(startPosition))) {
      startPosition = 'start';
    }
    count = clampEventCount(count);

    if (readState) {
      readState.requestedCount = count;
      readState.startPosition = startPosition;
      readState.rawCount = 0;
    }

    const connection = await connectionManager.getOrCreate(config);
    debug('', 'Streaming %s events from %s', direction, streamName);
    try {
      for await (const event of connection.readStream(streamName, {
        direction: `${direction}s`,
        maxCount: count,
        fromRevision: !Number.isNaN(Number(startPosition)) ? BigInt(startPosition) : startPosition,
        resolveLinkTos
      })) {
        if (readState) {
          readState.rawCount += 1;
          readState.lastPosition = positionOf(event);
        }
        const mapped = mapEvent(event);
        if (keepEvent(mapped, config.includeDeleted)) yield mapped;
      }
    } catch (err) {
      if (!(err instanceof StreamNotFoundError)) throw err;
    }
  };
