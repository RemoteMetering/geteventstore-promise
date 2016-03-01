var debug = require('debug')('geteventstore:writeEvents'),
    Eventstore = require('event-store-client'),
    eventFactory = require('../eventFactory'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Write Events - ';

module.exports = function(config) {
    return function(streamName, events, options) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(events, baseErr + 'Events not provided');

            var connection = new Eventstore.Connection(config.tcp);
            connection.writeEvents(streamName, Eventstore.ExpectedVersion.Any, false, events, config.tcp.credentials, function(result) {
                debug('Result', result);
                connection.close();
                if (!_.isEmpty(result.error))
                    return reject(baseErr + result.error);

                return resolve(result);
            });
        });
    };
};