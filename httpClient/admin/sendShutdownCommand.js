var debug = require('debug')('geteventstore:sendShutdownCommand'),
    req = require('request-promise'),
    url = require('url');

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/admin/shutdown';
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