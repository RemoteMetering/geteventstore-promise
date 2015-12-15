var debug = require('debug')('geteventstore:getevents'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {

    var buildGetEventsUrl = function(stream, startPosition, length, direction) {
        if (startPosition === undefined) startPosition = 0;
        length = length || 1000;
        direction = direction || 'forward';

        var streamPath = JSON.parse(JSON.stringify(config.http));
        streamPath.pathname = '/streams/' + stream + '/' + startPosition + '/' + direction + '/' + length + '?embed=body';

        return url.format(streamPath);
    };

    return function(streamName, startPosition, length, direction) {
        var options = {
            uri: buildGetEventsUrl(streamName, startPosition, length, direction),
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