var debug = require('debug')('geteventstore:getAllStreamEvents'),
    EventStoreClient = require('event-store-client'),
    createConnection = require('./createConnection'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash');

var baseErr = 'Subscribe to Stream From - ';

module.exports = function(config) {
    return function(streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings) {
        settings = settings || {};
        return new Promise(function(resolve, reject) {
            assert(streamName, baseErr + 'Stream Name not provided');
            if (fromEventNumber == 0) fromEventNumber = undefined;

            var catchUpSettings = new EventStoreClient.CatchUpSubscription.Settings();

            if (settings.resolveLinkTos) catchUpSettings.resolveLinkTos = settings.resolveLinkTos;
            if (settings.maxLiveQueueSize) catchUpSettings.maxLiveQueueSize = settings.maxLiveQueueSize;
            if (settings.readBatchSize) catchUpSettings.readBatchSize = settings.readBatchSize;
            if (settings.debug) catchUpSettings.debug = settings.debug;

            var connection = createConnection(config, reject);
            connection.subscribeToStreamFrom(streamName, fromEventNumber, config.credentials, onEventAppeared, onLiveProcessingStarted, onDropped, catchUpSettings);
            resolve(connection);
        });
    };
};