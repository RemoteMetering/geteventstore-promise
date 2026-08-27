import assert from 'assert';
import connectionManager from './connectionManager.js';

const baseErr = 'Delete stream - ';

export default (config) =>
  async (streamName, hardDelete = false) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    const connection = await connectionManager.getOrCreate(config);
    return hardDelete ? connection.tombstoneStream(streamName) : connection.deleteStream(streamName);
  };
