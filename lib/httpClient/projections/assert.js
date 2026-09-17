import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:assertProjection');
const baseErr = 'Assert Projection - ';

export default (config, httpClient, getAllProjectionsInfo) =>
  // enabled is accepted for signature parity with the gRPC client but is not honoured here:
  // the HTTP create call below always requests an enabled projection.
  async (name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled, trackEmittedStreams) => {
    assert(name, `${baseErr}Name not provided`);
    assert(projectionContent, `${baseErr}Projection Content not provided`);

    mode = mode || 'continuous';
    checkpointsEnabled = mode === 'continuous' ? true : checkpointsEnabled || false;
    emitEnabled = emitEnabled || false;
    trackEmittedStreams = trackEmittedStreams || false;

    const projectionsInfo = await getAllProjectionsInfo();
    const projectionExists = projectionsInfo.projections.some((projection) => projection.name === name);
    debug('', 'Projection Exists: %j', projectionExists);

    const options = projectionExists
      ? {
          url: `${config.baseUrl}/projection/${name}/query`,
          method: 'PUT',
          params: {
            emit: emitEnabled ? 'yes' : 'no'
          },
          data: projectionContent
        }
      : {
          url: `${config.baseUrl}/projections/${mode}`,
          method: 'POST',
          params: {
            name,
            enabled: 'yes',
            emit: emitEnabled ? 'yes' : 'no',
            checkpoints: checkpointsEnabled ? 'yes' : 'no',
            trackemittedstreams: trackEmittedStreams ? 'yes' : 'no'
          },
          data: projectionContent
        };

    debug('', 'Options: %j', options);
    const response = await httpClient(options);
    debug('', 'Response: %j', response.data);
    return response.data;
  };
