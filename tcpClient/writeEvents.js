var debug = require('debug')('geteventstore:writeEvents'),
    createConnection = require('./createConnection'),
    eventFactory = require('../eventFactory'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Write Events - ';

module.exports = function(config) {
    return function(streamName, events, options) {
        return new Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(events, baseErr + 'Events not provided');
            assert.equal(true, events.constructor === Array, baseErr + 'Events should be an array');

            if (events.length == 0)
                return resolve();

            options = options || {};
            options.expectedVersion = options.expectedVersion || -2;

            var eventsToWrite = _.cloneDeep(events);

            var connection = createConnection(config, reject);
            connection.writeEvents(streamName, options.expectedVersion, false, eventsToWrite, config.credentials, function(result) {
                debug('', 'Result: ' + JSON.stringify(result));
                connection.close();
                if (!_.isEmpty(result.error))
                    return reject(result.error);

                return resolve(result);
            });
        });
    };
};