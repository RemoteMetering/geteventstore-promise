import connectionManager from '../connectionManager';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:assertProjection');
const baseErr = 'Assert Projection - ';

const doesProjectionExist = async (projectionsInfo, name) => {
	const projection = projectionsInfo.find(projection => projection.name === name);
	if (projection) return true;
	return false;
};

const buildCreateOptions = (
	config,
	name,
	projectionContent,
	mode,
	enabled,
	emitEnabled,
	checkpointsEnabled,
	trackEmittedStreams
) => {
	const options = {
		url: `${config.baseUrl}/projections/${mode}`,
		method: 'POST',
		params: {
			name,
			enabled: enabled ? 'yes' : 'no',
			emit: emitEnabled ? 'yes' : 'no',
			checkpoints: checkpointsEnabled ? 'yes' : 'no',
			trackemittedstreams: trackEmittedStreams ? 'yes' : 'no',
		},
		data: projectionContent
	};

	return options;
};

const buildUpdateOptions = (config, name, projectionContent, emitEnabled) => {
	const options = {
		url: `${config.baseUrl}/projection/${name}/query`,
		method: 'PUT',
		params: {
			emit: emitEnabled ? 'yes' : 'no'
		},
		data: projectionContent
	};

	return options;
};

export default (config, getAllProjectionsInfo) => async (name, projectionContent, trackEmittedStreams) => {
	assert(name, `${baseErr}Name not provided`);
	assert(projectionContent, `${baseErr}Projection Content not provided`);

	trackEmittedStreams = trackEmittedStreams || false;

	let projectionsInfo = await getAllProjectionsInfo();
	const projectionExists = await doesProjectionExist(projectionsInfo, name);
	debug('', 'Projection Exists: %j', projectionExists);

	const connection = await connectionManager.create(config);
	try {
		let response;
		if (!projectionExists) response = await connection.createProjection(name, projectionContent, { trackEmittedStreams });
		else response = await connection.updateProjection(name, projectionContent, { trackEmittedStreams });

		debug('', 'Response: %j', response);
		let projectionsInfo = await getAllProjectionsInfo();
		return projectionsInfo.find(projection => projection.name === name);
	} finally {
		connection.releaseConnection();
	}
};