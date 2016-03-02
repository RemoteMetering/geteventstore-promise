var debug = require('debug')('geteventstore:checkStreamExists'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildStreamUrl = function(streamName) {
        var streamPath = JSON.parse(JSON.stringify(config.http));
        streamPath.pathname = '/streams/' + streamName;

        return url.format(streamPath);
    };

    return function(streamName) {
        var options = {
            uri: buildStreamUrl(streamName),
            method: 'GET'
        };

        return req(options).then(function(response) {
            return response.statusCode == 200;
        });
    };
};