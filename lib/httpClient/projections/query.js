import debugModule from 'debug';
import assert from 'assert';

export default (config, httpClient, resource, label) => {
  const debug = debugModule(`metronomic-kurrentdb-client:getProjection${label}`);
  const baseErr = `Get Projection ${label} - `;

  return async (name, options) => {
    assert(name, `${baseErr}Name not provided`);

    const params = {};
    if (options && options.partition) params.partition = options.partition;

    const urlOptions = {
      url: `${config.baseUrl}/projection/${name}/${resource}`,
      headers: {
        'Content-Type': 'application/vnd.eventstore.events+json'
      },
      method: 'GET',
      params
    };
    debug('', 'Options: %j', urlOptions);
    const response = await httpClient(urlOptions);
    debug('', 'Response: %j', response.data);
    return response.data;
  };
};
