var debug = require('debug')('geteventstore:getEventsByType'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Get Events by Type - ';

module.exports = function(config) {
    return function(streamName, eventTypes, startPosition, length, direction, resolveLinkTos) {
        return Promise.resolve().then(function() {
            assert(eventTypes, baseErr + 'Event Types not provided');

            var getEvents = require('./getEvents')(config);
            return getEvents(streamName, startPosition, length, direction, resolveLinkTos).then(function(events) {
                return _.filter(events, function(event) {
                    return _.includes(eventTypes, event.eventType);
                });
            });
        });
    };
};