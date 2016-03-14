var debug = require('debug')('geteventstore:appendToStream'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(stream) {
        var urlObj = JSON.parse(JSON.stringify(config.http));
        urlObj.pathname = '/streams/' + stream;
        return url.format(urlObj);
    };

    return function(stream, events, options) {
        options = options || {};
        options.expectedVersion = options.expectedVersion || -2;

        var reqOptions = {
            uri: buildUrl(stream),
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