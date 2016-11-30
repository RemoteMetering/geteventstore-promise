var debug = require('debug')('geteventstore:sendScavengeCommand'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    url = require('url');

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/admin/scavenge';
        return url.format(urlObj);
    };

    return function() {
        var options = {
            uri: buildUrl(),
            method: 'POST'
        };

        return req(options).then(function(response) {
            debug('', 'Response: ' + JSON.stringify(response));
            return response;
        });
    };
};