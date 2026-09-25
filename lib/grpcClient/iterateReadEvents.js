import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import debugModule from 'debug';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import positionOf from './utilities/positionOf.js';

const debug = debugModule('metronomic-kurrentdb-client:iterateReadEvents');
const baseErr = 'Read Events - ';

const toStartPosition = (startPosition, direction) => {
  if (startPosition === undefined) return direction === 'backward' ? 'end' : 'start';
  if (startPosition === null || startPosition === '') return 'start';
  if (startPosition === 'start' || startPosition === 'end') return startPosition;
  if (Number(startPosition) === -1) return 'end';
  if (typeof startPosition === 'bigint') return startPosition;
  const revision = Number(startPosition);
  return Number.isInteger(revision) && revision >= 0 ? revision : 'start';
};

export default (config, direction) =>
  async function* (streamName, startPosition, count, resolveLinkTos = true, readState) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    direction = direction || 'forward';
    startPosition = toStartPosition(startPosition, direction);
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
        fromRevision: typeof startPosition === 'string' ? startPosition : BigInt(startPosition),
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
