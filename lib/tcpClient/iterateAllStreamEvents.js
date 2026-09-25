import assert from 'assert';
import connectionManager from './connectionManager.js';
import clampEventCount from '../utilities/clampEventCount.js';
import mapEvents from './utilities/mapEvents.js';

const baseErr = 'Get All Stream Events - ';

export default (config) =>
  async function* (streamName, chunkSize, startPosition, resolveLinkTos = true) {
    assert(streamName, `${baseErr}Stream Name not provided`);

    chunkSize = clampEventCount(chunkSize, 'event chunk size');

    const readChunk = async (position) => {
      const connection = await connectionManager.create(config);
      try {
        return await connection.readStreamEventsForward(
          streamName,
          position,
          chunkSize,
          resolveLinkTos,
          config.credentials
        );
      } finally {
        connection.releaseConnection();
      }
    };

    let position = startPosition || 0;
    while (true) {
      const result = await readChunk(position);
      if (result.error) throw new Error(result.error);

      yield* mapEvents(result.events, config.includeDeleted);

      if (result.isEndOfStream !== false) return;
      position = result.nextEventNumber;
    }
  };
