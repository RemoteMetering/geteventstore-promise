var debug = require('debug')('geteventstore:checkStreamExists'),
    req = require('request-promise'),
    assert = require('assert'),
    url = require('url'),
    q = require('q');

var baseErr = 'Check Stream Exists - ';

module.exports = function(config) {
    var buildUrl = function(streamName, extraArgs) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName + extraArgs;
        return url.format(urlObj);
    };

    return function(streamName) {
        return q().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');

            var options = {
                uri: buildUrl(streamName, '/0/forward/1?embed=body'),
                method: 'GET'
            };

            return req(options).then(function(response) {
                return true;
            }).catch(function(err) {
                var options = {
                    uri: buildUrl(streamName, ''),
                    method: 'GET'
                };
                return req(options).then(function(responseAgain) {
                    return true;
                }).catch(function(errAgain) {
                    return false;
                });
            });
        });
    };
};