var debug = require('debug')('geteventstore:writeEvents'),
    req = require('request-promise'),
    assert = require('assert'),
    url = require('url'),
    q = require('q');

var baseErr = 'Write Events - ';

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName;
        return url.format(urlObj);
    };

    return function(streamName, events, options) {
        return q().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(events, baseErr + 'Events not provided');

            options = options || {};
            options.expectedVersion = options.expectedVersion || -2;

            var reqOptions = {
                uri: buildUrl(streamName),
                headers: {
                    "Content-Type": "application/vnd.eventstore.events+json",
                    "ES-ExpectedVersion": options.expectedVersion
                },
                method: 'POST',
                body: events,
                json: true
            };
            debug('', 'Write events: ' + JSON.stringify(reqOptions));
            return req(reqOptions);
        });
    };
};