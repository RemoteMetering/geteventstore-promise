// Runs one projection command across every non-transient projection. Backs enableAll and disableAll.
// The listing is /projections/all-non-transient, so one-time projections are included.
export default (getAllProjectionsInfo, command) => async () => {
  const projectionsInfo = await getAllProjectionsInfo();
  return Promise.all(projectionsInfo.projections.map((projection) => command(projection.name)));
};
