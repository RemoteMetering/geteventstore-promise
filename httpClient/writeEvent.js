var debug = require('debug')('geteventstore:appendToStream'),
    url = require('url'),
    req = require('request-promise'),
    eventFactory = require('../eventFactory');

module.exports = function(config) {
    var buildUrl = function(streamName) {
        var urlObj = JSON.parse(JSON.stringify(config.http));
        urlObj.pathname = '/streams/' + streamName;
        return url.format(urlObj);
    };

    return function(streamName, eventType, data, metaData, options) {
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
            json: true
        };
        debug('', 'Append To Stream: ' + JSON.stringify(reqOptions));
        return req(reqOptions);
    };
};