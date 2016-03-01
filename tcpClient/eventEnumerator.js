var debug = require('debug')('geteventstore:eventEnumerator'),
    Eventstore = require('event-store-client'),
    assert = require('assert'),
    q = require('q'),
    _ = require('underscore');

var baseErr = 'Event Enumerator - ';

var getNextBatch = function(config, streamName, startEvent, length, direction) {
    return q.Promise(function(resolve, reject) {
        assert(streamName, baseErr + 'Stream Name not provided');

        var connection = new Eventstore.Connection(config.tcp);

        function handleResult(result) {
            console.log('Next Event Number ', result.nextEventNumber);
            debug('Result', result);
            connection.close();

            if (!_.isEmpty(result.error))
                return reject(baseErr + result.error);

            startEvent.eventNumber = result.nextEventNumber;
            return resolve({
                isEndOfStream: result.isEndOfStream,
                events: result.events
            });
        }

        if (direction == 'forward')
            connection.readStreamEventsForward(streamName, startEvent.eventNumber, length, true, false, null, config.tcp.credentials, handleResult);
        else
            connection.readStreamEventsBackward(streamName, startEvent.eventNumber, length, true, false, null, config.tcp.credentials, handleResult);
    });
};

module.exports = function(config) {
    return function(streamName, direction) {
        direction = direction || 'forward';

        var startEvent = {
            eventNumber: direction == 'forward' ? 0 : -1
        };

        return {
            first: function(length) {
                startEvent.eventNumber = direction == 'forward' ? 0 : -1;
                return getNextBatch(config, streamName, startEvent, length, direction);
            },
            last: function(length) {
                startEvent.eventNumber = direction == 'forward' ? -1 : length;

                var originalDirection = direction;
                if (direction == 'forward')
                    direction = 'backward';

                return getNextBatch(config, streamName, startEvent, length, direction).then(function(result) {
                    if (originalDirection == 'forward')
                        result.events.reverse();

                    direction = originalDirection;
                    return result;
                });
            },
            previous: function(length) {
                if (startEvent.eventNumber != -1 && startEvent.eventNumber != 0)
                    startEvent.eventNumber = startEvent.eventNumber - length + 1;

                return getNextBatch(config, streamName, startEvent, length, direction);
            },
            next: function(length) {
                return getNextBatch(config, streamName, startEvent, length, direction);
            }
        };
    };
};