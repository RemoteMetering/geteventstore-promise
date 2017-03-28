var debug = require('debug')('geteventstore:getevents'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Get Events - ';

module.exports = function(config) {
    var buildUrl = function(stream, startPosition, length, direction) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${stream}/${startPosition}/${direction}/${length}`;
        return url.format(urlObj);
    };

    return function(streamName, startPosition, length, direction, resolveLinkTos) {
        return Promise.resolve().then(function() {
            assert(streamName, `${baseErr}Stream Name not provided`);

            length = length || 1000;

            if (length > 4096) {
                console.warn('WARNING: Max event return limit exceeded. Using the max of 4096');
                length = 4096;
            }

            direction = direction || 'forward';
            startPosition = startPosition === undefined && direction === 'backward' ? 'head' : startPosition || 0;
            resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

            var options = {
                uri: buildUrl(streamName, startPosition, length, direction),
                method: 'GET',
                headers: {
                    "Content-Type": "application/vnd.eventstore.events+json",
                    "ES-ResolveLinkTos": resolveLinkTos.toString()
                },
                qs: {
                    embed: 'body'
                },
                json: true,
                timeout: config.timeout
            };
            debug('', 'Options: ', options);
            return req(options).then(function(response) {
                response.entries.forEach(function(entry) {
                    if (entry.data) entry.data = JSON.parse(entry.data);
                });

                if (direction === 'forward')
                    return response.entries.reverse();

                return response.entries;
            });
        });
    };
};