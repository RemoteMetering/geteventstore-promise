var debug = require('debug')('geteventstore:writeEvent'),
    connectionManager = require('./connectionManager'),
    client = require('eventstore-node'),
    Promise = require('bluebird'),
    assert = require('assert'),
     uuid = require('uuid'),
    _ = require('lodash');

var baseErr = 'Write Event - ';

module.exports = function(config) {
    return function(streamName, eventType, data, metaData, options) {
        return Promise.resolve().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(eventType, baseErr + 'Event Type not provided');
            assert(data, baseErr + 'Event Data not provided');

            options = options || {};
            options.expectedVersion = options.expectedVersion || -2;

           var event = client.createJsonEventData(uuid.v4(), data, metaData, eventType);

            return connectionManager.create(config).then(function(connection) {
              return  connection.appendToStream(streamName, options.expectedVersion, [event], config.credentials).then(function(result) {
                    debug('', 'Result: %j', result);
                    if (!_.isEmpty(result.error))
                         throw new Error(result.error);

                    return result;
                });
            });
        });
    };
};