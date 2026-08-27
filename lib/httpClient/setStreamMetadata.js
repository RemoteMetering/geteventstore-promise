import debugModule from 'debug';
import assert from 'assert';
import toRawStreamMetadata from '../utilities/toRawStreamMetadata.js';
import toExpectedVersion from '../utilities/toExpectedVersion.js';
import EventFactory from '../EventFactory.js';

const debug = debugModule('metronomic-kurrentdb-client:setStreamMetadata');
const eventFactory = new EventFactory();
const baseErr = 'Set stream metadata - ';

export default (config, httpClient) => async (streamName, metadata, options) => {
  assert(streamName, `${baseErr}Stream Name not provided`);
  assert(metadata, `${baseErr}Metadata not provided`);

  const events = [eventFactory.newEvent('$metadata', toRawStreamMetadata(metadata))];

  const reqOptions = {
    url: `${config.baseUrl}/streams/${streamName}/metadata`,
    headers: {
      'Content-Type': 'application/vnd.eventstore.events+json',
      'ES-ExpectedVersion': toExpectedVersion(options && options.expectedVersion)
    },
    method: 'POST',
    data: events,
    timeout: config.timeout
  };

  debug('', 'Set stream metadata: %j', reqOptions);
  const response = await httpClient(reqOptions);
  debug('', 'Response: %j', response.data);
  return response.data;
};
