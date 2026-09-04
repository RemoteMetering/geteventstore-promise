import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:restartProjectionSubsystem');

export default (config, httpClient) => async () => {
  const response = await httpClient.post(`${config.baseUrl}/projections/restart`);
  debug('', 'Response: %j', response.data);
  return response.data;
};
