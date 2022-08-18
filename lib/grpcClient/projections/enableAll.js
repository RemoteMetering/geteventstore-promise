export default (getAllProjectionsInfo, startProjection) => async () => {
	const projectionsInfo = await getAllProjectionsInfo();
	return Promise.all(projectionsInfo.map(projection => startProjection(projection.name)));
};