var debug = require('debug')('geteventstore:getevents'),
    req = require('request-promise'),
    assert = require('assert'),
    url = require('url'),
    q = require('q');

var baseErr = 'Get Events - ';

module.exports = function(config) {
    var buildUrl = function(stream, startPosition, length, direction) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + stream + '/' + startPosition + '/' + direction + '/' + length + '?embed=body';
        return url.format(urlObj);
    };

    return function(streamName, startPosition, length, direction) {
        return q().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');

            startPosition = startPosition || 0;
            length = length || 1000;
            direction = direction || 'forward';

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
        });
    };
};