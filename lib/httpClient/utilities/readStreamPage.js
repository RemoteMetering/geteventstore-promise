import debugModule from 'debug';
import mapEvents from './mapEvents.js';

const debug = debugModule('metronomic-kurrentdb-client:readStreamPage');

// Performs a single Atom read-page request
export default (config, httpClient) => async (streamName, startPosition, direction, count, resolveLinkTos, embed) => {
  count = count || 1000;

  if (count > 4096) {
    console.warn('WARNING: Max event count exceeded. Using the max of 4096');
    count = 4096;
  }

  direction = direction || 'forward';
  startPosition = startPosition === undefined && direction === 'backward' ? 'head' : startPosition || 0;
  resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

  const options = {
    url: `${config.baseUrl}/streams/${streamName}/${startPosition}/${direction}/${count}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/vnd.eventstore.events+json',
      'ES-ResolveLinkTos': resolveLinkTos.toString()
    },
    params: {
      embed
    },
    timeout: config.timeout
  };

  debug('', 'Options: ', options);
  const response = await httpClient(options);

  // Embedded event data arrives as JSON strings
  if (embed === 'body') {
    for (const entry of response.data.entries) {
      if (entry.data) entry.data = JSON.parse(entry.data);
    }
  }

  const events = mapEvents(direction === 'forward' ? response.data.entries.reverse() : response.data.entries);
  delete response.data.entries;
  return { data: response.data, events, direction, startPosition };
};
