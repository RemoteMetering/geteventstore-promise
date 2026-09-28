import assert from 'assert';
import connectionManager from './connectionManager.js';

const baseErr = 'Delete stream - ';

export default (config) =>
  async (streamName, hardDelete = false) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    const connection = await connectionManager.create(config);
    try {
      return await connection.deleteStream(streamName, -2, hardDelete, config.credentials);
    } finally {
      connection.releaseConnection();
    }
  };
