var debug = require('debug')('geteventstore:getevents'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(stream, startPosition, length, direction) {
        if (startPosition === undefined) startPosition = 0;
        length = length || 1000;
        direction = direction || 'forward';

        var urlObj = JSON.parse(JSON.stringify(config.http));
        urlObj.pathname = '/streams/' + stream + '/' + startPosition + '/' + direction + '/' + length + '?embed=body';
        return url.format(urlObj);
    };

    return function(streamName, startPosition, length, direction) {
        var options = {
            uri: buildUrl(streamName, startPosition, length, direction),
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json"
            },
            method: 'GET',
            json: true
        };
        debug('', 'Getting Events: ' + JSON.stringify(options));
        return req(options).then(function(response) {
            response.entries.forEach(function(entry) {
                entry.data = JSON.parse(entry.data);
            });

            if (direction == 'forward')
                return response.entries;

            return response.entries.reverse();
        });
    };
};