export default (getAllProjectionsInfo, stopProjection) => async () => {
	const projectionsInfo = await getAllProjectionsInfo();
	return Promise.all(projectionsInfo.map(projection => stopProjection(projection.name)));
};