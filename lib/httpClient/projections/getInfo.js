import assert from 'assert';
import debugModule from 'debug';

const debug = debugModule("geteventstore:getProjectionInfo");
const baseErr = "Get Projection Info - ";

export default (getAllProjectionsInfo, getConfig) => async (
  name,
  includeConfig
) => {
  assert(name, `${baseErr}Name not provided`);

  const projectionsInfo = await getAllProjectionsInfo();
  const projectionInfo = projectionsInfo.projections.find(
    (projection) => projection.name === name
  );
  debug("", "Projection Info: %j", projectionInfo);

  if (includeConfig === true) {
    const config = await getConfig(name);
    debug("", "Config: %j", config);
    return { ...projectionInfo, config };
  }

  return projectionInfo;
};
