import debugModule from 'debug';
import clampEventCount from '../../utilities/clampEventCount.js';

const debug = debugModule('metronomic-kurrentdb-client:readStreamPage');

// Performs a single Atom read-page request
export default (config, httpClient) =>
  async (streamName, startPosition, direction, count, resolveLinkTos = true, embed) => {
    count = clampEventCount(count);

    direction = direction || 'forward';
    startPosition = startPosition === undefined && direction === 'backward' ? 'head' : startPosition || 0;

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

    const { entries, ...data } = response.data;
    // Atom pages arrive newest first, so forward reads fill the result backwards to come out oldest first.
    const forward = direction === 'forward';
    const events = new Array(entries.length);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      // Embedded event data arrives as a JSON string
      if (embed === 'body' && entry.data) entry.data = JSON.parse(entry.data);
      entry.created = entry.updated;
      events[forward ? entries.length - 1 - i : i] = entry;
    }

    return { data, events, direction, startPosition };
  };
