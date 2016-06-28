var debug = require('debug')('geteventstore:eventEnumerator'),
    createConnection = require('./createConnection'),
    assert = require('assert'),
    q = require('q'),
    _ = require('lodash');

var baseErr = 'Event Enumerator - ';

var getNextBatch = function(config, streamName, state, length, direction) {
    state.isFirstEnumeration = false;
    return q.Promise(function(resolve, reject) {
        assert(streamName, baseErr + 'Stream Name not provided');

        var connection = createConnection(config, reject);

        function handleResult(result) {
            debug('', 'Result: ' + JSON.stringify(result));
            connection.close();

            if (!_.isEmpty(result.error))
                return reject(baseErr + result.error);

            state.nextEventNumber = result.nextEventNumber;
            return resolve({
                isEndOfStream: result.isEndOfStream,
                events: result.events
            });
        }

        if (direction == 'forward')
            connection.readStreamEventsForward(streamName, state.nextEventNumber, length, true, false, null, config.credentials, handleResult);
        else
            connection.readStreamEventsBackward(streamName, state.nextEventNumber, length, true, false, null, config.credentials, handleResult);
    });
};

var esDirectionWorkaroundHandler = function(direction) {
    var wasSwopped = false;

    if (direction == 'forward') {
        wasSwopped = true;
        direction = 'backward';
    }

    return {
        direction: direction,
        swopResult: function(state, length, result) {
            if (wasSwopped) {
                state.nextEventNumber += length + 1;
                result.events.reverse();
            }
            return result;
        }
    }
};

var stateHandler = function(direction) {
    var Handler = function() {
        this.isFirstEnumeration = true;
        this.setToFirst();
    };

    Handler.prototype.setToFirst = function() {
        this.nextEventNumber = direction == 'forward' ? 0 : -1;
    };

    Handler.prototype.setToLast = function(length) {
        this.nextEventNumber = direction == 'forward' ? -1 : length - 1;
    };

    Handler.prototype.setToPrevious = function(length) {
        if (!this.isFirstEnumeration)
            this.adjustByLength(length);
    };

    Handler.prototype.keepInBoundsAdjustment = function(length) {
        if (direction == 'backward')
            return length;

        var adjustment = length;
        if (this.nextEventNumber < -1) {
            adjustment -= Math.abs(this.nextEventNumber);
            this.nextEventNumber = 0;
        }

        return adjustment;
    };

    Handler.prototype.adjustByLength = function(length) {
        this.nextEventNumber += direction == 'forward' ? length * -1 : length;
    };

    return new Handler();
};

module.exports = function(config) {
    return function(streamName, direction) {
        direction = direction || 'forward';
        var state = stateHandler(direction);

        return {
            first: function(length) {
                state.setToFirst();
                return getNextBatch(config, streamName, state, length, direction);
            },
            last: function(length) {
                state.setToLast(length);

                var handler = esDirectionWorkaroundHandler(direction);
                return getNextBatch(config, streamName, state, length, handler.direction).then(function(result) {
                    return handler.swopResult(state, length, result);
                });
            },
            previous: function(length) {
                state.setToPrevious(length);
                length = state.keepInBoundsAdjustment(length);

                return getNextBatch(config, streamName, state, length, direction).then(function(result) {
                    state.adjustByLength(length);
                    return result;
                });
            },
            next: function(length) {
                return getNextBatch(config, streamName, state, length, direction);
            }
        };
    };
};