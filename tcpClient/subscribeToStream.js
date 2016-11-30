var debug = require('debug')('geteventstore:getAllStreamEvents'),
    createConnection = require('./createConnection'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Subscribe to Stream - ';

module.exports = function(config) {
    return function(streamName, onEventAppeared, onConfirmed, onDropped, resolveLinkTos) {
        return new Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            resolveLinkTos = resolveLinkTos || false;

            var connection = createConnection(config, reject);
            connection.subscribeToStream(streamName, resolveLinkTos, onEventAppeared, onConfirmed, onDropped, config.credentials);
            resolve(connection);
        });
    };
};