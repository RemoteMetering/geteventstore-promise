import assert from 'assert';
import connectionManager from './connectionManager.js';
import { mapEvent, keepEvent } from './utilities/mapEvents.js';

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
      for await (const event of connection.readStream(streamName, {
        direction: 'forwards',
        maxCount: chunkSize,
        fromRevision: revision,
        resolveLinkTos
      })) {
        hasNewEvents = true;
        // A deleted target leaves event undefined, so fall back to the link for the paging cursor.
        lastRevision = event.event ? event.event.revision : event.link.revision;
        const mapped = mapEvent(event);
        if (keepEvent(mapped, config.includeDeleted)) yield mapped;
      }

      if (!hasNewEvents) return;
      fromRevision = lastRevision + 1n;
    }
  };
