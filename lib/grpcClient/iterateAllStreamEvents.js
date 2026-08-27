import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import positionOf from './utilities/positionOf.js';

const baseErr = 'Get All Stream Events - ';

export default (config) =>
  async function* (streamName, chunkSize, startPosition, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    chunkSize = clampEventCount(chunkSize, 'event chunk size');

    const connection = await connectionManager.getOrCreate(config);
    let fromRevision = startPosition || 'start';
    while (true) {
      let lastRevision;
      const revision = Number.isNaN(Number(fromRevision)) ? fromRevision : BigInt(fromRevision);
      try {
        for await (const event of connection.readStream(streamName, {
          direction: 'forwards',
          maxCount: chunkSize,
          fromRevision: revision,
          resolveLinkTos
        })) {
          lastRevision = positionOf(event);
          const mapped = mapEvent(event);
          if (keepEvent(mapped, config.includeDeleted)) yield mapped;
        }
      } catch (err) {
        if (!(err instanceof StreamNotFoundError)) throw err;
        return;
      }

      if (lastRevision === undefined) return;
      fromRevision = BigInt(lastRevision) + 1n;
    }
  };
