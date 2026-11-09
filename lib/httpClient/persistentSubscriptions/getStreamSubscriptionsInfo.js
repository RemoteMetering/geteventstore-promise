import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config, httpClient) => async (streamName) => {
  assert(streamName, `${baseError}Stream name not provided`);

  const response = await httpClient.get(`${config.baseUrl}/subscriptions/${streamName}`);
  debug('', 'Response: %j', response.data);
  return response.data;
};
