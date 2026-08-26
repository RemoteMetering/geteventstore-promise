import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import positionOf from './utilities/positionOf.js';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadEvents');
const baseErr = 'Read Events - ';

export default (config, direction) =>
  async function* (streamName, startPosition, count, resolveLinkTos, readState) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    direction = direction || 'forward';
    if (startPosition === undefined && direction === 'backward') {
      startPosition = 'end';
    } else if (Number.isNaN(Number(startPosition))) {
      startPosition = 'start';
    }
    count = count || 1000;
    resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

    if (count > 4096) {
      console.warn('WARNING: Max event count exceeded. Using the max of 4096');
      count = 4096;
    }

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
