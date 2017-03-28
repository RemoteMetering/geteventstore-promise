var debug = require('debug')('geteventstore:removePersistentSubscription');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var url = require('url');

var baseErr = 'Remove persistent subscriptions - ';

var createRemoveRequest = function(name, streamName, config) {
    var urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = `/subscriptions/${streamName}/${name}`;

    var uri = url.format(urlObj);

    var request = {
        uri: uri,
        method: 'DELETE',
        json: true
    };
    return request;
};

module.exports = function(config) {
    return function(name, streamName) {
        return Promise.resolve().then(function() {
            assert(name, `${baseErr}Persistent Subscription Name not provided`);
            assert(streamName, `${baseErr}Stream Name not provided`);

            var options = createRemoveRequest(name, streamName, config);
            debug('', 'Options: %j', options);
            return req(options).then(function(response) {
                debug('', 'Response: %j', response);
                return response;
            });
        });
    };
};