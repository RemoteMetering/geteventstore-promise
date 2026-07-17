import assert from 'assert';
import generateEventId from '../utilities/generateEventId.js';
import writeEvents from './writeEvents.js';

const baseErr = 'Write Event - ';

export default (config) => {
  const appendEvents = writeEvents(config);

  return (streamName, eventType, data, metaData, options) => {
    assert(streamName, `${baseErr}Stream Name not provided`);
    assert(eventType, `${baseErr}Event Type not provided`);
    assert(data, `${baseErr}Event Data not provided`);

    return appendEvents(streamName, [{ eventId: generateEventId(), eventType, data, metadata: metaData }], options);
  };
};
