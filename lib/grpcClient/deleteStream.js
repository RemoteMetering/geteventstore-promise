import assert from 'assert';
import connectionManager from './connectionManager.js';
import { jsonSafe } from './utilities/jsonSafe.js';

const baseErr = 'Delete stream - ';

export default (config) =>
  async (streamName, hardDelete = false) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    const connection = await connectionManager.getOrCreate(config);
    return jsonSafe(
      hardDelete ? await connection.tombstoneStream(streamName) : await connection.deleteStream(streamName)
    );
  };
