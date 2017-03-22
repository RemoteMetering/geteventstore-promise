var debug = require('debug')('geteventstore:getevents'),
    connectionManager = require('./connectionManager'),
    mapEvents = require('./utilities/mapEvents'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Get Events - ';

module.exports = function(config) {
    return function(streamName, startPosition, length, direction, resolveLinkTos) {
        return Promise.resolve().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');

            direction = direction || 'forward';
            startPosition = startPosition === undefined && direction === 'backward' ? -1 : startPosition || 0;
            length = length || 1000;
            resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

            if (length > 4096) {
                console.warn('WARNING: Max event return limit exceeded. Using the max of 4096');
                length = 4096;
            }

            return connectionManager.create(config).then(function(connection) {
                function handleResult(result) {
                    debug('', 'Result: ' + JSON.stringify(result));
                    if (!_.isEmpty(result.error)) throw new Error(result.error);
                    return mapEvents(result.events);
                }

                if (direction === 'forward')
                    return connection.readStreamEventsForward(streamName, startPosition, length, resolveLinkTos, config.credentials).then(handleResult);
                else
                    return connection.readStreamEventsBackward(streamName, startPosition, length, resolveLinkTos, config.credentials).then(handleResult);
            });
        });
    };
};