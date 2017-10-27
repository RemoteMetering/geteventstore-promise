import debugModule from 'debug';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:getProjectionInfo');
const baseErr = 'Get Projection Info - ';

export default (config) => {
	const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);

	return async(name) => {
		assert(name, `${baseErr}Name not provided`);

		const projectionsInfo = await getAllProjectionsInfo();
		const projectionInfo = _.find(projectionsInfo.projections, projection => projection.name === name);
		debug('', 'Projection Info: %j', projectionInfo);
		return projectionInfo;
	};
};