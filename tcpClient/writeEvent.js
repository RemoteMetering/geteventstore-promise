var debug = require('debug')('geteventstore:writeEvent'),
    Eventstore = require('event-store-client'),
    eventFactory = require('../eventFactory'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Write Event - ';

module.exports = function(config) {
    return function(streamName, eventType, data, metaData, options) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(eventType, baseErr + 'Event Type not provided');
            assert(data, baseErr + 'Event Data not provided');

            options = options || {};
            options.expectedVersion = options.expectedVersion || -2;
            
            var events = [eventFactory.NewEvent(eventType, data, metaData)];

            var connection = new Eventstore.Connection(config.tcp);
            connection.writeEvents(streamName, options.expectedVersion, false, events, config.tcp.credentials, function(result) {
                debug('Result', result);
                connection.close();
                if (!_.isEmpty(result.error))
                    return reject(baseErr + result.error);

                return resolve(result);
            });
        });
    };
};