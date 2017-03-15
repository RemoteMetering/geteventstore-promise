var debug = require('debug')('geteventstore:getProjectionState'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash'),
    url = require('url');

var baseErr = 'Get Projection State - ';

module.exports = function(config) {
    var buildUrl = function(name) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projection/' + name + '/state';
        return url.format(urlObj);
    };

    return function(name, options) {
        return Promise.resolve().then(function() {
            assert(name, baseErr + 'Name not provided');

            var qs = {};
            options = options || {};

            if (!_.isEmpty(options.partition)) qs.partition = options.partition;
            var urlOptions = {
                uri: buildUrl(name),
                headers: {
                    "Content-Type": "application/vnd.eventstore.events+json"
                },
                method: 'GET',
                json: true,
                qs: qs
            };

            debug('', 'Options: ' + JSON.stringify(options));
            return req(urlOptions).then(function(response) {
                debug('', 'Response: ' + JSON.stringify(response));
                return response;
            });
        });
    };
};