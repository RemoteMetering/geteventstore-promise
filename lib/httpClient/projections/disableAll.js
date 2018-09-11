export default (config) => {
	const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
	const stopProjection = require('./stop')(config);

	return async () => {
		const projectionsInfo = await getAllProjectionsInfo();
		return Promise.all(projectionsInfo.projections.map(projection => stopProjection(projection.name)));
	};
};