var debug = require('debug')('geteventstore:getSubscriptionInfo');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var url = require('url');

var baseError = 'Get Stream Subscriptions Info - ';

module.exports = function(config) {
    var buildUrl = function(name, stream) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/subscriptions/' + stream + '/' + name + '/info';
        return url.format(urlObj);
    };

    return function(name, stream) {
        return Promise.resolve().then(function() {
            assert(name, baseError + 'Persistant Subscription Name not provided');
            assert(stream, baseError + 'Stream not provided');

            var options = {
                uri: buildUrl(name, stream),
                method: 'GET',
                json: true,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            return req(options).then(function(response) {
                debug('', 'Response: ' + JSON.stringify(response));
                return response;
            });
        });
    };
};