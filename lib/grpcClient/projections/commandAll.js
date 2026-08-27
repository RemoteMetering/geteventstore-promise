// Runs one projection command across every non-transient projection. Backs enableAll and disableAll.
export default (getAllProjectionsInfo, command) => async () => {
  const projections = await getAllProjectionsInfo();
  return Promise.all(projections.map((projection) => command(projection.name)));
};
