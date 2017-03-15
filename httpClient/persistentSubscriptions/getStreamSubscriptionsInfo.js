var debug = require('debug')('geteventstore:getStreamSubscriptionsInfo');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var url = require('url');

var baseError = 'Get Stream Subscriptions Info - ';

module.exports = function(config) {
    var buildUrl = function(stream) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/subscriptions/' + stream;
        return url.format(urlObj);
    };

    return function(stream) {
        return Promise.resolve().then(function() {
            assert(stream, baseError + 'Stream not provided');
            var options = {
                uri: buildUrl(stream),
                method: 'GET',
                json: true,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            debug('', 'Options: ' + JSON.stringify(options));
            return req(options).then(function(response) {
                debug('', 'Response: ' + JSON.stringify(response));
                return response;
            });
        });
    };
};