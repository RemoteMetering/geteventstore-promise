var debug = require('debug')('geteventstore:stopProjection'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Stop Projection - ';

module.exports = function(config) {
    var buildUrl = function(name) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projection/' + name + '/command/disable';
        return url.format(urlObj);
    };

    return function(name) {
        return Promise.resolve().then(function() {
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