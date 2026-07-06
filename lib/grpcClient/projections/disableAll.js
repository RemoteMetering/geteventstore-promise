export default (getAllProjectionsInfo, stopProjection) => async () => {
	const projections = await getAllProjectionsInfo();
	return Promise.all(projections.map(projection => stopProjection(projection.name)));
};