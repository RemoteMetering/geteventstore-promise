var debug = require('debug')('geteventstore:projectionState'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {

    var buildProjectionsUrl = function(stream) {
        var streamPath = JSON.parse(JSON.stringify(config.http));
        streamPath.pathname = '/projection/' + stream + '/state';

        return url.format(streamPath);
    };

    return function(streamId) {
        var options = {
            uri: buildProjectionsUrl(streamId),
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