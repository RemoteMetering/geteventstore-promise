var debug = require('debug')('geteventstore:getevents'),
    req = require('request-promise'),
    assert = require('assert'),
    _ = require('underscore'),
    url = require('url'),
    q = require('q');

var baseErr = 'Get Events - ';

module.exports = function(config) {
    var buildUrl = function(stream, startPosition, length, direction) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + stream + '/' + startPosition + '/' + direction + '/' + length;
        return url.format(urlObj);
    };

    return function(streamName, startPosition, length, direction) {
        return q().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');

            length = length || 1000;
            length = length > 4096 ? 4096 : length;
            direction = direction || 'forward';
            startPosition = startPosition || 0;
            startPosition = startPosition == 0 && direction == 'backward' ? 'head' : startPosition;

            var options = {
                uri: buildUrl(streamName, startPosition, length, direction),
                method: 'GET',
                headers: {
                    "Content-Type": "application/vnd.eventstore.events+json"
                },
                qs: {
                    embed: 'body'
                },
                json: true
            };
            debug('', 'Getting Events: ' + JSON.stringify(options));
            return req(options).then(function(response) {
                response.entries.forEach(function(entry) {
                    entry.data = JSON.parse(entry.data);
                });

                if (direction == 'forward')
                    return response.entries.reverse();

                return response.entries;
            }).catch(function(err) {
                console.log('err ', err.stack);

            });
        });
    };
};