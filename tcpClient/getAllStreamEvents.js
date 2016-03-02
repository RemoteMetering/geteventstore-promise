var debug = require('debug')('geteventstore:getAllStreamEvents'),
    Eventstore = require('event-store-client'),
    eventFactory = require('../eventFactory'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Get All Stream Events - ';

module.exports = function(config) {
    return function(streamName, chunkSize, options) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            var connection = new Eventstore.Connection(config.tcp);
            var events = [];

            function getNextChunk(startEvent) {
                connection.readStreamEventsForward(streamName, startEvent, chunkSize || 250, true, false, null, config.tcp.credentials, function(result) {
                    debug('Result', result);
                    if (!_.isEmpty(result.error))
                        return reject(baseErr + result.error);

                    events.push(result.events);

                    if (result.isEndOfStream === false)
                        return getNextChunk(result.nextEventNumber);
                    else {
                        connection.close();
                        events = _.flatten(events);
                        return resolve(events);
                    }
                });
            }
            getNextChunk(0);
        });
    };
};