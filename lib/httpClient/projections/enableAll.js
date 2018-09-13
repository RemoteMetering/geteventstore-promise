export default (getAllProjectionsInfo, startProjection) => async () => {
	const projectionsInfo = await getAllProjectionsInfo();
	return Promise.all(projectionsInfo.projections.map(projection => startProjection(projection.name)));
};