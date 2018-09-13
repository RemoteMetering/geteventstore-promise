import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:getProjectionInfo');
const baseErr = 'Get Projection Info - ';

export default (getAllProjectionsInfo) => async (name) => {
	assert(name, `${baseErr}Name not provided`);

	const projectionsInfo = await getAllProjectionsInfo();
	const projectionInfo = projectionsInfo.projections.find(projection => projection.name === name);
	debug('', 'Projection Info: %j', projectionInfo);
	return projectionInfo;
};