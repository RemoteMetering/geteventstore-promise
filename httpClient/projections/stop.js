var debug = require('debug')('geteventstore:stopProjection'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(name) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projection/' + name + '/command/disable';
        return url.format(urlObj);
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