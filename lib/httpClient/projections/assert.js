import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:assertProjection');
const baseErr = 'Assert Projection - ';

const doesProjectionExist = async (projectionsInfo, name) => {
	const projection = projectionsInfo.projections.find(projection => projection.name === name);
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

export default (config, httpClient, getAllProjectionsInfo) => async (name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled, trackEmittedStreams) => {
	assert(name, `${baseErr}Name not provided`);
	assert(projectionContent, `${baseErr}Projection Content not provided`);

	mode = mode || 'continuous';
	enabled = enabled || true;
	checkpointsEnabled = mode === 'continuous' ? true : checkpointsEnabled || false;
	emitEnabled = emitEnabled || false;
	trackEmittedStreams = trackEmittedStreams || false;

	const projectionsInfo = await getAllProjectionsInfo();
	const projectionExists = await doesProjectionExist(projectionsInfo, name);
	debug('', 'Projection Exists: %j', projectionExists);

	let options = {};
	if (!projectionExists) options = buildCreateOptions(config, name, projectionContent, mode, enabled, emitEnabled, checkpointsEnabled, trackEmittedStreams);
	else options = buildUpdateOptions(config, name, projectionContent, emitEnabled);

	debug('', 'Options: %j', options);
	const response = await httpClient(options);
	debug('', 'Response: %j', response.data);
	return response.data;
};