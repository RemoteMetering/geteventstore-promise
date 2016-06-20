var debug = require('debug')('geteventstore:getevents'),
    createConnection = require('./createConnection'),
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
            length = length || 1000;
            
            if (length > 4096) {
                console.warn('WARNING: Max event return limit exceeded. Using the max of 4096');
                length = 4096;
            }

            var connection = createConnection(config, reject);

            function handleResult(result) {
                connection.close();
                debug('', 'Result: ' + JSON.stringify(result));
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