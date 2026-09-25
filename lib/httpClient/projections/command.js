import debugModule from 'debug';
import assert from 'assert';

export default (config, httpClient, command, label) => {
  const debug = debugModule(`metronomic-kurrentdb-client:${label.toLowerCase()}Projection`);
  const baseErr = `${label} Projection - `;

  return async (name) => {
    assert(name, `${baseErr}Name not provided`);

    const response = await httpClient.post(`${config.baseUrl}/projection/${name}/command/${command}`);
    debug('', 'Response: %j', response.data);
    return response.data;
  };
};
