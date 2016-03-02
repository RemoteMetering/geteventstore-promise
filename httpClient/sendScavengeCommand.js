var debug = require('debug')('geteventstore:sendScavengeCommand'),
    q = require('q'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildScavengeUrl = function() {
        var url = 'http://' + config.http.credentials.username + ':' + config.http.credentials.password + '@' + config.http.hostname + ':' + config.http.port + '/admin/scavenge';
        return url;
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