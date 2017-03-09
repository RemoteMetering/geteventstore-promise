var debug = require('debug')('geteventstore:writeEvents'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Write Events - ';

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName;
        return url.format(urlObj);
    };

    return function(streamName, events, options) {
        return Promise.resolve().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(events, baseErr + 'Events not provided');
            assert.equal(true, events.constructor === Array, baseErr + 'Events should be an array');

            if (events.length === 0)
                return;

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
                json: true,
                timeout: config.timeout
            };
            debug('', 'Write events: ' + JSON.stringify(reqOptions));
            return req(reqOptions);
        });
    };
};