var debug = require('debug')('geteventstore:stopProjection'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(name) {
        var url = 'http://' + config.http.credentials.username + ':' + config.http.credentials.password + '@' + config.http.hostname + ':' + config.http.port + '/projection/' + name + '/command/disable';
        return url;
    };

    return function(name) {
        var options = {
            uri: buildUrl(name),
            method: 'POST'
        };

        debug('Options', options);
        return req(options).then(function(response) {
            debug('Response', response);
            return JSON.parse(response);
        });
    };
};