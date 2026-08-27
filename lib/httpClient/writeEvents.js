import debugModule from 'debug';
import assert from 'assert';
import toExpectedVersion from '../utilities/toExpectedVersion.js';

const debug = debugModule('metronomic-kurrentdb-client:writeEvents');
const baseErr = 'Write Events - ';

export default (config, httpClient) => async (streamName, events, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(events, `${baseErr}Events not provided`);
  assert(Array.isArray(events), `${baseErr}Events should be an array`);

  if (events.length === 0) return undefined;

  const reqOptions = {
    url: `${config.baseUrl}/streams/${streamName}`,
    headers: {
      'Content-Type': 'application/vnd.eventstore.events+json',
      'ES-ExpectedVersion': toExpectedVersion(options && options.expectedVersion)
    },
    method: 'POST',
    data: events,
    timeout: config.timeout
  };

  debug('', 'Write events: %j', reqOptions);
  const response = await httpClient(reqOptions);
  debug('', 'Response: %j', response.data);
  return response.data;
};
