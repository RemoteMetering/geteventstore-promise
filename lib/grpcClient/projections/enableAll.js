export default (getAllProjectionsInfo, startProjection) => async () => {
	const projections = await getAllProjectionsInfo();
	return Promise.all(projections.map(projection => startProjection(projection.name)));
};