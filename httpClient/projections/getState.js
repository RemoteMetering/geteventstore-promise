var debug = require('debug')('geteventstore:getProjectionState'),
    assert = require('assert'),
    req = require('request-promise'),
    url = require('url'),
    q = require('q');

var baseErr = 'Get Projection State - ';

module.exports = function(config) {
    var buildUrl = function(name) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projection/' + name + '/state';
        return url.format(urlObj);
    };

    return function(name) {
        return q().then(function() {
            assert(name, baseErr + 'Name not provided');

            var options = {
                uri: buildUrl(name),
                headers: {
                    "Content-Type": "application/vnd.eventstore.events+json"
                },
                method: 'GET',
                json: true
            };

            return req(options).then(function(response) {
                return response;
            });
        });
    };
};