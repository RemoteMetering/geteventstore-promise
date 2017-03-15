var debug = require('debug')('geteventstore:getAllStreamEvents'),
    createConnection = require('./createConnection'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Get All Stream Events - ';

module.exports = function(config) {
    return function(streamName, chunkSize, startPosition, resolveLinkTos) {
        return new Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            chunkSize = chunkSize || 1000;
            if (chunkSize > 4096) {
                console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
                chunkSize = 4096;
            }
            resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

            var connection = createConnection(config, reject);
            var events = [];

            function getNextChunk(startPosition) {
                connection.readStreamEventsForward(streamName, startPosition, chunkSize, resolveLinkTos, false, null, config.credentials, function(result) {
                    debug('', 'Result: ' + JSON.stringify(result));
                    if (!_.isEmpty(result.error))
                        return reject(result.error);

                    events.push(result.events);

                    if (result.isEndOfStream === false)
                        return getNextChunk(result.nextEventNumber);
                    else {
                        connection.close();
                        events = _.flatten(events);
                        return resolve(events);
                    }
                });
            }
            getNextChunk(startPosition || 0);
        });
    };
};