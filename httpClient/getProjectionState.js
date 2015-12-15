var debug = require('debug')('geteventstore:projectionState'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {

    var buildProjectionsUrl = function(streamName) {
        var streamPath = JSON.parse(JSON.stringify(config.http));
        streamPath.pathname = '/projection/' + streamName + '/state';

        return url.format(streamPath);
    };

    return function(streamName) {
        var options = {
            uri: buildProjectionsUrl(streamName),
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json"
            },
            method: 'GET',
            json: true
        };

        return req(options).then(function(response) {
            return response;
        });
    };
};