var debug = require('debug')('geteventstore:sendShutdownCommand'),
    q = require('q'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config.http));
        urlObj.pathname = '/admin/shutdown';
        return url.format(urlObj);
    };

    return function() {
        var options = {
            uri: buildUrl(),
            method: 'POST'
        };

        return req(options).then(function(response) {
            debug('Response', response);
            return response;
        });
    };
};