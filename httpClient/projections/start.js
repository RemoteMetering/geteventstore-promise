var debug = require('debug')('geteventstore:startProjection'),
    assert = require('assert'),
    req = require('request-promise'),
    url = require('url'),
    q = require('q');

var baseErr = 'Start Projection - ';

module.exports = function(config) {
    var buildUrl = function(name) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projection/' + name + '/command/enable';
        return url.format(urlObj);
    };

    return function(name) {
        return q().then(function() {
            assert(name, baseErr + 'Name not provided');

            var options = {
                uri: buildUrl(name),
                method: 'POST'
            };

            debug('', 'Options: ' + JSON.stringify(options));
            return req(options).then(function(response) {
                debug('', 'Response: ' + JSON.stringify(response));
                return JSON.parse(response);
            });
        });
    };
};