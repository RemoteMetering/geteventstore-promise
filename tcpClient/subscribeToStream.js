var debug = require('debug')('geteventstore:subscribeToStream'),
    createConnection = require('./createConnection'),
    Promise = require('bluebird'),
    assert = require('assert');

var baseErr = 'Subscribe to Stream - ';

module.exports = function(config) {
    return function(streamName, onEventAppeared, onConfirmed, onDropped, resolveLinkTos) {
        return new Promise(function(resolve, reject) {
            assert(streamName, `${baseErr}Stream Name not provided`);

            resolveLinkTos = resolveLinkTos || false;

            var connection = createConnection(config, reject);
            var subscription = connection.subscribeToStream(streamName, resolveLinkTos, onEventAppeared, onConfirmed, onDropped, config.credentials);
            debug('', 'Subscription: %j', subscription);
            resolve(connection);
        });
    };
};