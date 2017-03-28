var debug = require('debug')('geteventstore:assertPersistentSubscription');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var url = require('url');

var baseErr = 'Assert persistent subscriptions - ';

var createPersistentSubscriptionRequest = (name, streamName, options, config) => {
    var urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = `/subscriptions/${streamName}/${name}`;
    var uri = url.format(urlObj);

    return {
        uri,
        method: 'PUT',
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: options
    };
};

var createPersistentSubscriptionOptions = options => {
    options = options || {};

    return {
        resolveLinktos: options.resolveLinktos,
        startFrom: options.startFrom === undefined ? 0 : options.startFrom,
        extraStatistics: options.extraStatistics,
        checkPointAfterMilliseconds: options.checkPointAfterMilliseconds,
        liveBufferSize: options.liveBufferSize,
        readBatchSize: options.readBatchSize,
        bufferSize: options.bufferSize,
        maxCheckPointCount: options.maxCheckPointCount,
        maxRetryCount: options.maxRetryCount,
        maxSubscriberCount: options.maxSubscriberCount,
        messageTimeoutMilliseconds: options.messageTimeoutMilliseconds,
        minCheckPointCount: options.minCheckPointCount,
        namedConsumerStrategy: options.namedConsumerStrategy,
    };
};

module.exports = config => (name, streamName, options) => Promise.resolve().then(() => {
    assert(name, `${baseErr}Persistent Subscription Name not provided`);
    assert(streamName, `${baseErr}Stream Name not provided`);

    var persistentSubscriptionOptions = createPersistentSubscriptionOptions(options);
    var createRequest = createPersistentSubscriptionRequest(name, streamName, persistentSubscriptionOptions, config);
    debug('', 'Options: %j', createRequest);
    return req(createRequest).then(response => {
        debug('', 'Response: %j', response);
        return response;
    }).catch(err => {
        if (err.statusCode !== 409) throw err;

        var updateRequest = createPersistentSubscriptionRequest(name, streamName, persistentSubscriptionOptions, config);
        updateRequest.method = 'POST';

        debug('', 'Update Options: %j', updateRequest);
        return req(updateRequest).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    });
});