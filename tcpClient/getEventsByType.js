var debug = require('debug')('geteventstore:getEventsByType'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Get Events by Type - ';

module.exports = function(config) {
    return function(streamName, eventTypes, startPosition, length, direction) {
        return q().then(function() {
            assert(eventTypes, baseErr + 'Event Types not provided');

            var getEvents = require('./getEvents')(config);
            return getEvents(streamName, startPosition, length, direction).then(function(events) {
                return _.filter(events, function(event) {
                    return _.contains(eventTypes, event.eventType);
                });
            });
        });
    };
};