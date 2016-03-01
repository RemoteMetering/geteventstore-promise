var debug = require('debug')('geteventstore:getAllProjectionInfo'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function() {
        var streamPath = JSON.parse(JSON.stringify(config.http));
        streamPath.pathname = '/projections/all-non-transient';
        return url.format(streamPath);
    };

    return function() {
        var options = {
            uri: buildUrl(),
            method: 'GET'
        };

        return req(options).then(function(response) {
            debug('Response', response);
            return response;
        });
    };
};