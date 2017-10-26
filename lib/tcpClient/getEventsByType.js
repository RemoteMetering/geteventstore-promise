import Promise from 'bluebird';
import assert from 'assert';
import _ from 'lodash';

const baseErr = 'Get Events by Type - ';

module.exports = config => (streamName, eventTypes, startPosition, length, direction, resolveLinkTos) => Promise.resolve().then(() => {
    assert(eventTypes, `${baseErr}Event Types not provided`);

    const getEvents = require('./getEvents')(config);
    return getEvents(streamName, startPosition, length, direction, resolveLinkTos).then(events => _.filter(events, event => _.includes(eventTypes, event.eventType)));
});