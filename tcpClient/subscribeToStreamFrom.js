const debug = require('debug')('geteventstore:subscribeToStreamFrom');
const EventStoreClient = require('event-store-client');
const createConnection = require('./createConnection');
const Promise = require('bluebird');
const assert = require('assert');

const baseErr = 'Subscribe to Stream From - ';

module.exports = config => (
    streamName,
    fromEventNumber,
    onEventAppeared,
    onLiveProcessingStarted,
    onDropped,
    settings
) => {
    settings = settings || {};
    return new Promise((resolve, reject) => {
        assert(streamName, `${baseErr}Stream Name not provided`);
        if (fromEventNumber === 0) fromEventNumber = undefined;

        const catchUpSettings = new EventStoreClient.CatchUpSubscription.Settings();

        if (settings.resolveLinkTos) catchUpSettings.resolveLinkTos = settings.resolveLinkTos;
        if (settings.maxLiveQueueSize) catchUpSettings.maxLiveQueueSize = settings.maxLiveQueueSize;
        if (settings.readBatchSize) catchUpSettings.readBatchSize = settings.readBatchSize;
        if (settings.debug) catchUpSettings.debug = settings.debug;

        const connection = createConnection(config, reject);
        const subscription = connection.subscribeToStreamFrom(streamName, fromEventNumber, config.credentials, onEventAppeared, onLiveProcessingStarted, onDropped, catchUpSettings);
        debug('', 'Subscription: %j', subscription);
        resolve(connection);
    });
};