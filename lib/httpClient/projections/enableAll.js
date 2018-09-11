export default (config) => {
	const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
	const startProjection = require('./start')(config);

	return async () => {
		const projectionsInfo = await getAllProjectionsInfo();
		return Promise.all(projectionsInfo.projections.map(projection => startProjection(projection.name)));
	};
};