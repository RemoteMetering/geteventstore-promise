import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:assertProjection');
const baseErr = 'Assert Projection - ';

const doesProjectionExist = async(config, name) => {
	const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
	const projectionsInfo = await getAllProjectionsInfo();
	const projection = _.find(projectionsInfo.projections, projection => projection.name === name);
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
		uri: `${config.baseUrl}/projections/${mode}`,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		qs: {
			name,
			enabled: enabled ? 'yes' : 'no',
			emit: emitEnabled ? 'yes' : 'no',
			checkpoints: checkpointsEnabled ? 'yes' : 'no',
		},
		body: projectionContent
	};

	return options;
};

const buildUpdateOptions = (config, name, projectionContent, emitEnabled) => {
	const options = {
		uri: `${config.baseUrl}/projection/${name}/query`,
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		qs: {
			emit: emitEnabled ? 'yes' : 'no',
		},
		body: projectionContent
	};

	return options;
};

export default (config) => async(name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled) => {
	assert(name, `${baseErr}Name not provided`);
	assert(projectionContent, `${baseErr}Projecion Contnet not provided`);

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
	const response = await req(options);
	debug('', 'Response: %j', response);
	return JSON.parse(response);
};