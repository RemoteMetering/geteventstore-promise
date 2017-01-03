var debug = require('debug')('geteventstore:assertPersistentSubscription');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var url = require('url');

var baseErr = 'Assert persistent subscriptions - ';

var createPersistentSubscriptionRequest = function(name, streamName, options, config) {
    var urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = '/subscriptions/' + streamName + '/' + name;

    var uri = url.format(urlObj);

    var request = {
        uri: uri,
        method: 'PUT',
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: options
    };
    return request;
};

var createPersistentSubscriptionOptions = function(options) {
    options = options || {};

    return {
        resolveLinktos: options.resolveLinktos,
        startFrom: options.startFrom == undefined ? 0 : options.startFrom,
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

module.exports = function(config) {
    return function(name, streamName, options) {
        return Promise.resolve().then(function() {
            assert(name, baseErr + 'Persistent Subscription Name not provided');
            assert(streamName, baseErr + 'Stream Name not provided');

            var requestOptions = createPersistentSubscriptionOptions(options);
            var createRequst = createPersistentSubscriptionRequest(name, streamName, requestOptions, config);
            return req(createRequst).catch(function(err) {
                if (err.statusCode !== 409) throw err;

                var updateRequest = createPersistentSubscriptionRequest(name, streamName, requestOptions, config);
                updateRequest.method = 'POST';
                return req(updateRequest);
            });
        });
    };
};