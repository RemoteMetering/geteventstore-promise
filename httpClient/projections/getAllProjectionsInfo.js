var debug = require('debug')('geteventstore:getAllProjectionsInfo'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projections/all-non-transient';
        return url.format(urlObj);
    };

    return function() {
        var options = {
            uri: buildUrl(),
            method: 'GET'
        };

        return req(options).then(function(response) {
            debug('Response', response);
            return JSON.parse(response);
        });
    };
};