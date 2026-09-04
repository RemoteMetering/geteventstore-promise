import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import mapEvents from './utilities/mapEvents.js';

const baseErr = 'Get All Stream Events - ';

export default (config) =>
  async function* (streamName, chunkSize, startPosition, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    chunkSize = clampEventCount(chunkSize, 'event chunk size');

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
