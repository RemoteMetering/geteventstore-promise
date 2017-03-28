var debug = require('debug')('geteventstore:writeEvents'),
    connectionManager = require('./connectionManager'),
    client = require('eventstore-node'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Write Events - ';

module.exports = function(config) {
    return function(streamName, events, options) {
        return Promise.resolve().then(function() {
            assert(streamName, `${baseErr}Stream Name not provided`);
            assert(events, `${baseErr}Events not provided`);
            assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

            if (events.length === 0) return;

            options = options || {};
            options.transactionWriteSize = options.transactionWriteSize || 50;
            options.expectedVersion = options.expectedVersion || -2;

            var eventsToWrite = _.map(events, function(ev) {
                return client.createJsonEventData(ev.eventId, ev.data, ev.metadata, ev.eventType);
            });

            return connectionManager.create(config).then(function(connection) {
                return connection.startTransaction(streamName, options.expectedVersion, config.credentials).then(function(transaction) {
                    var eventChunks = _.chunk(eventsToWrite, options.transactionWriteSize);
                    return Promise.each(eventChunks, function(events) {
                        return transaction.write(events);
                    }).then(function() {
                        return transaction.commit().then(function(result) {
                            debug('', 'Result: %j', result);
                            return result;
                        });
                    }).catch(function(err) {
                        transaction.rollback();
                        throw err;
                    });
                });
            });
        });
    };
};