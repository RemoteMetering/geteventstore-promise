var debug = require('debug')('geteventstore:sendScavengeCommand'),
    q = require('q'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildScavengeUrl = function() {
        var commandPath = JSON.parse(JSON.stringify(config.http));
        commandPath.pathname = '/admin/scavenge';
        return url.format(commandPath);
    };

    return function() {
        var options = {
            uri: buildScavengeUrl(),
            method: 'POST'
        };

        return req(options).then(function(response) {
            debug('Response', response);
            return response;
        });
    };
};