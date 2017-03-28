var debug = require('debug')('geteventstore:ping'),
    req = require('request-promise'),
    url = require('url');

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/ping';
        return url.format(urlObj);
    };

    return function() {
        var options = {
            uri: buildUrl(),
            method: 'GET',
            timeout: config.timeout
        };
        debug('', 'Options: %j', options);
        return req(options).then(function(response) {
            debug('', 'Response: %j', response);
            return response;
        });
    };
};