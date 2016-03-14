var debug = require('debug')('geteventstore:projectionState'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projection/' + streamName + '/state';
        return url.format(urlObj);
    };

    return function(streamName) {
        var options = {
            uri: buildUrl(streamName),
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