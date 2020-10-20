import assert from 'assert';
import axios from 'axios';
import debugModule from 'debug';

const debug = debugModule("geteventstore:getProjectionConfig");
const baseErr = "Get Projection Config - ";

export default (config) => async (name) => {
  assert(name, `${baseErr}Name not provided`);

  const response = await axios.get(
    `${config.baseUrl}/projection/${name}/config`
  );
  debug("", "Response: %j", response.data);

  const projectionConfig = {
    ...response.data,
    ...{
      emitEnabled:
        response.data.emitEnabled === undefined
          ? false
          : response.data.emitEnabled,
      trackEmittedStreams:
        response.data.trackEmittedStreams === undefined
          ? false
          : response.data.trackEmittedStreams,
    },
  };

  return projectionConfig;
};
