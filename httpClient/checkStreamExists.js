var debug = require('debug')('geteventstore:checkStreamExists'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Check Stream Exists - ';

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName + '/head/backward/1';
        return url.format(urlObj);
    };

    return function(streamName) {
        return Promise.resolve().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');

            var options = {
                uri: buildUrl(streamName),
                method: 'GET',
                json: true,
                headers: {
                    "Content-Type": "application/vnd.eventstore.events+json"
                }
            };

            return req(options).then(function(response) {
                return true;
            }).catch(function(err) {
                return false;
            });
        });
    };
};