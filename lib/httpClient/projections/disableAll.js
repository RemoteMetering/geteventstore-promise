import Promise from 'bluebird';

export default (config) => {
	const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
	const stopProjection = require('./stop')(config);

	return async() => {
		const projectionsInfo = await getAllProjectionsInfo();
		return Promise.map(projectionsInfo.projections, projection => stopProjection(projection.name));
	};
};