import withConnection from '../utilities/withConnection.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:assertProjection');
const baseErr = 'Assert Projection - ';

export default (config, getAllProjectionsInfo) => async (name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled, trackEmittedStreams) => {
	assert(name, `${baseErr}Name not provided`);
	assert(projectionContent, `${baseErr}Projection Content not provided`);
	assert(mode === undefined || mode === 'continuous', `${baseErr}Only 'continuous' projections are supported over gRPC`);

	enabled = enabled === undefined ? true : enabled;
	emitEnabled = emitEnabled || false;
	trackEmittedStreams = trackEmittedStreams || false;

	const projectionsInfo = await getAllProjectionsInfo();
	const projectionExists = projectionsInfo.some(projection => projection.name === name);
	debug('', 'Projection Exists: %j', projectionExists);

	return withConnection(config, async (connection) => {
		if (!projectionExists) {
			debug('', 'Create: %s', name);
			await connection.createProjection(name, projectionContent, { emitEnabled, trackEmittedStreams });
			if (!enabled) await connection.disableProjection(name);
		} else {
			debug('', 'Update: %s', name);
			await connection.updateProjection(name, projectionContent, { emitEnabled });
			if (enabled) await connection.enableProjection(name);
			else await connection.disableProjection(name);
		}
	});
};
