import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';
import { jsonSafe } from '../utilities/jsonSafe.js';

const debug = debugModule('metronomic-kurrentdb-client:getProjectionInfo');
const baseErr = 'Get Projection Info - ';

const isNotFound = (err) => {
  const message = (err?.message || '').toLowerCase();
  return err?.type === 'not-found' || message.includes('not found') || message.includes('notfound');
};

export default (config) => async (name) => {
  assert(name, `${baseErr}Name not provided`);

  const connection = await connectionManager.getOrCreate(config);
  let projectionInfo;
  try {
    projectionInfo = await connection.getProjectionStatus(name);
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
  debug('', 'Projection Info: %j', projectionInfo);

  return projectionInfo ? jsonSafe(projectionInfo) : undefined;
};
