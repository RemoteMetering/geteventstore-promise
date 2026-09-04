import debugModule from 'debug';
import assert from 'assert';
import toExpectedVersion from '../utilities/toExpectedVersion.js';
import EventFactory from '../EventFactory.js';

const debug = debugModule('metronomic-kurrentdb-client:writeEvent');
const eventFactory = new EventFactory();
const baseErr = 'Write Event - ';

export default (config, httpClient) => async (streamName, eventType, data, metaData, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(eventType, `${baseErr}Event Type not provided`);
  assert(data, `${baseErr}Event Data not provided`);

  const events = [eventFactory.newEvent(eventType, data, metaData)];

  const reqOptions = {
    url: `${config.baseUrl}/streams/${streamName}`,
    headers: {
      'Content-Type': 'application/vnd.eventstore.events+json',
      'ES-ExpectedVersion': toExpectedVersion(options?.expectedVersion)
    },
    method: 'POST',
    data: events,
    timeout: config.timeout
  };

  debug('', 'Write Event: %j', reqOptions);
  const response = await httpClient(reqOptions);
  debug('', 'Response: %j', response.data);
  return response.data;
};
