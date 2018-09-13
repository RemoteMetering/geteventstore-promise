import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:assertProjection');
const baseErr = 'Assert Projection - ';

const doesProjectionExist = async (config, name) => {
	const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
	const projectionsInfo = await getAllProjectionsInfo();
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
	checkpointsEnabled
) => {
	const options = {
		url: `${config.baseUrl}/projections/${mode}`,
		method: 'POST',
		params: {
			name,
			enabled: enabled ? 'yes' : 'no',
			emit: emitEnabled ? 'yes' : 'no',
			checkpoints: checkpointsEnabled ? 'yes' : 'no',
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
			emit: emitEnabled ? 'yes' : 'no',
		},
		data: projectionContent
	};

	return options;
};

export default (config) => async (name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled) => {
	assert(name, `${baseErr}Name not provided`);
	assert(projectionContent, `${baseErr}Projection Content not provided`);

	mode = mode || 'continuous';
	enabled = enabled || true;
	checkpointsEnabled = mode === 'continuous' ? true : checkpointsEnabled || false;
	emitEnabled = emitEnabled || false;

	const projectionExists = await doesProjectionExist(config, name);
	debug('', 'Projection Exists: %j', projectionExists);

	let options = {};
	if (!projectionExists) options = buildCreateOptions(config, name, projectionContent, mode, enabled, emitEnabled, checkpointsEnabled);
	else options = buildUpdateOptions(config, name, projectionContent, emitEnabled);

	debug('', 'Options: %j', options);
	const response = await axios(options);
	debug('', 'Response: %j', response.data);
	return response.data;
};