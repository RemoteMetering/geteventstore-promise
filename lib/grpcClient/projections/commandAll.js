// Runs one projection command across every projection the client can list. Backs enableAll and
// disableAll. Note the gRPC SDK's listProjections requests continuous projections only, so one-time
// projections are not included here (the HTTP client's all-non-transient listing does include them).
export default (getAllProjectionsInfo, command) => async () => {
  const projections = await getAllProjectionsInfo();
  return Promise.all(projections.map((projection) => command(projection.name)));
};
