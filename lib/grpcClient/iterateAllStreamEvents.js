import { StreamNotFoundError } from '@kurrent/kurrentdb-client';
import assert from 'assert';
import connectionManager from './connectionManager.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';
import positionOf from './utilities/positionOf.js';

const baseErr = 'Get All Stream Events - ';

export default (config) =>
  async function* (streamName, chunkSize, startPosition, resolveLinkTos) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    chunkSize = chunkSize || 1000;
    if (chunkSize > 4096) {
      console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
      chunkSize = 4096;
    }
    resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

    const connection = await connectionManager.getOrCreate(config);
    let fromRevision = startPosition || 'start';
    while (true) {
      let hasNewEvents = false;
      let lastRevision;
      let revision;
      if (typeof fromRevision === 'bigint') {
        revision = fromRevision;
      } else if (!Number.isNaN(Number(fromRevision))) {
        revision = BigInt(fromRevision);
      } else {
        revision = fromRevision;
      }
      try {
        for await (const event of connection.readStream(streamName, {
          direction: 'forwards',
          maxCount: chunkSize,
          fromRevision: revision,
          resolveLinkTos
        })) {
          hasNewEvents = true;
          lastRevision = positionOf(event);
          const mapped = mapEvent(event);
          if (keepEvent(mapped, config.includeDeleted)) yield mapped;
        }
      } catch (err) {
        if (!(err instanceof StreamNotFoundError)) throw err;
        return;
      }

      if (!hasNewEvents || lastRevision === undefined) return;
      fromRevision = BigInt(lastRevision) + 1n;
    }
  };
