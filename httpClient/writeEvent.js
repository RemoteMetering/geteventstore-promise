var debug = require('debug')('geteventstore:writeEvent'),
    eventFactory = require('../eventFactory'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Write Event - ';

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/streams/' + streamName;
        return url.format(urlObj);
    };

    return function(streamName, eventType, data, metaData, options) {
        return Promise.resolve().then(function() {
            assert(streamName, baseErr + 'Stream Name not provided');
            assert(eventType, baseErr + 'Event Type not provided');
            assert(data, baseErr + 'Event Data not provided');

            options = options || {};
            options.expectedVersion = options.expectedVersion || -2;

            var events = [eventFactory.NewEvent(eventType, data, metaData)];

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
            debug('', 'Write Event: ' + JSON.stringify(reqOptions));
            return req(reqOptions);
        });
    };
};