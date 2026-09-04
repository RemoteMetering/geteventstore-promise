import assert from 'assert';
import connectionManager from './connectionManager.js';

const baseErr = 'Check stream exits - ';

export default (config) => async (streamName) => {
  assert(streamName, `${baseErr}Stream Name not provided`);

  const connection = await connectionManager.getOrCreate(config);
  try {
    // Reading is only used to prove the stream exists, so the event itself is discarded.
    // eslint-disable-next-line no-unused-vars
    for await (const event of connection.readStream(streamName, {
      direction: 'forwards',
      maxCount: 1,
      fromRevision: 'start'
    }));
    return true;
  } catch (err) {
    if (err && err.type === 'stream-not-found') return false;
    throw err;
  }
};
