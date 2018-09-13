export default (getAllProjectionsInfo, stopProjection) => async () => {
	const projectionsInfo = await getAllProjectionsInfo();
	return Promise.all(projectionsInfo.projections.map(projection => stopProjection(projection.name)));
};