var debug = require('debug')('geteventstore:getAllStreamEvents'),
    createConnection = require('./createConnection'),
    eventFactory = require('../eventFactory'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Get All Stream Events - ';

module.exports = function(config) {
    return function(streamName, chunkSize, startEvent) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            var connection = createConnection(config, reject);
            var events = [];

            function getNextChunk(startEvent) {
                connection.readStreamEventsForward(streamName, startEvent, chunkSize || 250, true, false, null, config.credentials, function(result) {
                    debug('', 'Result: ' + JSON.stringify(result));
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
            getNextChunk(startEvent || 0);
        });
    };
};