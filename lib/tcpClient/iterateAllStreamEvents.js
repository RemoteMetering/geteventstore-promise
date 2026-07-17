import assert from 'assert';
import connectionManager from './connectionManager.js';
import mapEvents from './utilities/mapEvents.js';

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

    const connection = await connectionManager.create(config);
    try {
      let position = startPosition || 0;
      while (true) {
        const result = await connection.readStreamEventsForward(
          streamName,
          position,
          chunkSize,
          resolveLinkTos,
          config.credentials
        );
        if (result.error) throw new Error(result.error);

        for (const event of mapEvents(result.events, config.includeDeleted)) {
          yield event;
        }

        if (result.isEndOfStream !== false) return;
        position = result.nextEventNumber;
      }
    } finally {
      connection.releaseConnection();
    }
  };
