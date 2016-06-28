var debug = require('debug')('geteventstore:getAllStreamEvents'),
    EventStoreClient = require('event-store-client'),
    createConnection = require('./createConnection'),
    assert = require('assert'),
    q = require('q'),
    _ = require('lodash');

var baseErr = 'Subscribe to Stream From - ';

module.exports = function(config) {
    return function(streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings) {
        return q.Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');
            if (fromEventNumber == 0) fromEventNumber = undefined;

            var catchUpSettings = new EventStoreClient.CatchUpSubscription.Settings();

            if (settings && settings.resolveLinkTos)
                catchUpSettings.resolveLinkTos = settings.resolveLinkTos;

            var connection = createConnection(config, reject);
            connection.subscribeToStreamFrom(streamName, fromEventNumber, config.credentials, onEventAppeared, onLiveProcessingStarted, onDropped, catchUpSettings);
            resolve(connection);
        });
    };
};