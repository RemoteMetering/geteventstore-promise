var debug = require('debug')('geteventstore:getAllStreamEvents'),
    connectionManager = require('./connectionManager'),
    mapEvents = require('./utilities/mapEvents'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Get All Stream Events - ';

module.exports = function(config) {
    return function(streamName, chunkSize, startPosition, resolveLinkTos) {
        return Promise.resolve().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');

            chunkSize = chunkSize || 1000;
            if (chunkSize > 4096) {
                console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
                chunkSize = 4096;
            }
            resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

            return connectionManager.create(config).then(function(connection) {
                var events = [];

                function getNextChunk(startPosition) {
                    return connection.readStreamEventsForward(streamName, startPosition, chunkSize, resolveLinkTos, config.credentials).then(function(result) {
                        debug('', 'Result: ' + JSON.stringify(result));

                        if (!_.isEmpty(result.error))
                            throw new Error(result.error);

                        events.push(mapEvents(result.events));

                        if (result.isEndOfStream === false)
                            return getNextChunk(result.nextEventNumber);
                        else {
                            events = _.flatten(events);
                            return events;
                        }
                    });
                }
                return getNextChunk(startPosition || 0);
            });

        });
    };
};