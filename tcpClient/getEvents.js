var debug = require('debug')('geteventstore:getevents'),
    Eventstore = require('event-store-client'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Get Events - ';

module.exports = function(config) {
    return function(streamName, startPosition, length, direction) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            direction = direction || 'forward';
            startPosition = startPosition == undefined && direction == 'backward' ? -1 : startPosition || 0;
            length = length || 250;

            var connection = new Eventstore.Connection(config);

            function handleResult(result) {
                connection.close();
                debug('Result', result);
                if (!_.isEmpty(result.error))
                    return reject(baseErr + result.error);

                return resolve(result.events);
            }

            if (direction == 'forward')
                connection.readStreamEventsForward(streamName, startPosition, length, true, false, null, config.credentials, handleResult);
            else
                connection.readStreamEventsBackward(streamName, startPosition, length, true, false, null, config.credentials, handleResult);
        });
    };
};