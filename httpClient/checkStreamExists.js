var debug = require('debug')('geteventstore:checkStreamExists'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName + '/0/forward/1?embed=body';
        return url.format(urlObj);
    };

    return function(streamName) {
        var options = {
            uri: buildUrl(streamName),
            method: 'GET'
        };

        return req(options).then(function(response) {
            return true;
        }).catch(function(err) {
            return false;
        });
    };
};