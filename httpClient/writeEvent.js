var debug = require('debug')('geteventstore:appendToStream'),
    url = require('url'),
    req = require('request-promise'),
    eventFactory = require('../eventFactory');

module.exports = function(config) {

	var buildAppendStreamUrl = function(stream) {
	    var streamPath = JSON.parse(JSON.stringify(config.http));
	    streamPath.pathname = '/streams/' + stream;
	    return url.format(streamPath);
	};

    return function(stream, eventType, data, metaData, options) {
        options = options || {};
        options.expectedVersion = options.expectedVersion || -2;

        var events = [eventFactory.NewEvent(eventType, data, metaData)];

        var reqOptions = {
            uri: buildAppendStreamUrl(stream),
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