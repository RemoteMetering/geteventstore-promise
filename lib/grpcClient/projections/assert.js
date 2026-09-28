import debugModule from 'debug';
import assert from 'assert';
import connectionManager from '../connectionManager.js';

const debug = debugModule('metronomic-kurrentdb-client:assertProjection');
const baseErr = 'Assert Projection - ';

export default (config, getInfo) =>
  // checkpointsEnabled is accepted for signature parity with the HTTP client but is not honoured
  // here: only continuous projections are supported over gRPC, and those always checkpoint.
  async (name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled, trackEmittedStreams) => {
    assert(name, `${baseErr}Name not provided`);
    assert(projectionContent, `${baseErr}Projection Content not provided`);
    assert(
      mode === undefined || mode === 'continuous',
      `${baseErr}Only 'continuous' projections are supported over gRPC`
    );

    emitEnabled = emitEnabled || false;
    trackEmittedStreams = trackEmittedStreams || false;

    const projectionExists = (await getInfo(name)) !== undefined;
    debug('', 'Projection Exists: %j', projectionExists);

    const connection = await connectionManager.getOrCreate(config);
    if (!projectionExists) {
      debug('', 'Create: %s', name);
      await connection.createProjection(name, projectionContent, { emitEnabled, trackEmittedStreams });
      if (enabled !== undefined && !enabled) await connection.disableProjection(name);
    } else {
      debug('', 'Update: %s', name);
      await connection.updateProjection(name, projectionContent, { emitEnabled });
      if (enabled !== undefined) {
        if (enabled) await connection.enableProjection(name);
        else await connection.disableProjection(name);
      }
    }
  };
