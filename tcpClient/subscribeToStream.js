var debug = require('debug')('geteventstore:getAllStreamEvents'),
    createConnection = require('./createConnection'),
    assert = require('assert'),
    q = require('q'),
    _ = require('lodash');

var baseErr = 'Subscribe to Stream - ';

module.exports = function(config) {
    return function(streamName, onEventAppeared, onConfirmed, onDropped, resolveLinkTos) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');

            resolveLinkTos = resolveLinkTos || false;

            var connection = createConnection(config, reject);
            console.log('connection', connection);
            connection.subscribeToStream(streamName, resolveLinkTos, onEventAppeared, onConfirmed, onDropped, config.credentials);
            resolve(connection);
        });
    };
};