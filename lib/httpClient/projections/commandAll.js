// Runs one projection command across every non-transient projection. Backs enableAll and disableAll.
export default (getAllProjectionsInfo, command) => async () => {
  const projectionsInfo = await getAllProjectionsInfo();
  return Promise.all(projectionsInfo.projections.map((projection) => command(projection.name)));
};
