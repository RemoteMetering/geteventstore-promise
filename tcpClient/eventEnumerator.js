var debug = require('debug')('geteventstore:eventEnumerator'),
    connectionManager = require('./connectionManager'),
    mapEvents = require('./utilities/mapEvents'),
    Promise = require('bluebird'),
    assert = require('assert');

var baseErr = 'Event Enumerator - ';

var getNextBatch = (config, streamName, state, length, direction, resolveLinkTos) => {
    state.isFirstEnumeration = false;
    return Promise.resolve().then(() => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        return connectionManager.create(config).then(connection => {
            function handleResult(result) {
                debug('', 'Result: %j', result);

                state.nextEventNumber = result.nextEventNumber;
                return {
                    isEndOfStream: result.isEndOfStream,
                    events: mapEvents(result.events)
                };
            }

            if (direction === 'forward')
                return connection.readStreamEventsForward(streamName, state.nextEventNumber, length, resolveLinkTos, config.credentials).then(handleResult);
            return connection.readStreamEventsBackward(streamName, state.nextEventNumber, length, resolveLinkTos, config.credentials).then(handleResult);
        });
    });
};

var esDirectionWorkaroundHandler = direction => {
    var wasSwopped = false;

    if (direction === 'forward') {
        wasSwopped = true;
        direction = 'backward';
    }

    return {
        direction: direction,
        swopResult(state, length, result) {
            if (wasSwopped) {
                state.nextEventNumber += length + 1;
                result.events.reverse();
            }
            return result;
        }
    };
};

var stateHandler = direction => {
    var Handler = function() {
        this.isFirstEnumeration = true;
        this.setToFirst();
    };

    Handler.prototype.setToFirst = function() {
        this.nextEventNumber = direction === 'forward' ? 0 : -1;
    };

    Handler.prototype.setToLast = function(length) {
        this.nextEventNumber = direction === 'forward' ? -1 : length - 1;
    };

    Handler.prototype.setToPrevious = function(length) {
        if (!this.isFirstEnumeration)
            this.adjustByLength(length);
    };

    Handler.prototype.keepInBoundsAdjustment = function(length) {
        if (direction === 'backward')
            return length;

        var adjustment = length;
        if (this.nextEventNumber < -1) {
            adjustment -= Math.abs(this.nextEventNumber);
            this.nextEventNumber = 0;
        }

        return adjustment;
    };

    Handler.prototype.adjustByLength = function(length) {
        this.nextEventNumber += direction === 'forward' ? length * -1 : length;
    };

    return new Handler();
};

module.exports = config => (streamName, direction, resolveLinkTos) => {
    direction = direction || 'forward';
    resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;
    var state = stateHandler(direction);

    return {
        first(length) {
            state.setToFirst();
            return getNextBatch(config, streamName, state, length, direction, resolveLinkTos);
        },
        last(length) {
            state.setToLast(length);

            var handler = esDirectionWorkaroundHandler(direction);
            return getNextBatch(config, streamName, state, length, handler.direction, resolveLinkTos).then(result => handler.swopResult(state, length, result));
        },
        previous(length) {
            state.setToPrevious(length);
            length = state.keepInBoundsAdjustment(length);

            return getNextBatch(config, streamName, state, length, direction, resolveLinkTos).then(result => {
                state.adjustByLength(length);
                return result;
            });
        },
        next(length) {
            return getNextBatch(config, streamName, state, length, direction, resolveLinkTos);
        }
    };
};