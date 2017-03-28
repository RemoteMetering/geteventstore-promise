var debug = require('debug')('geteventstore:checkStreamExists'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Check Stream Exists - ';

module.exports = config => {
    var buildUrl = streamName => {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${streamName}/head/backward/1`;
        return url.format(urlObj);
    };

    return streamName => Promise.resolve().then(() => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        var options = {
            uri: buildUrl(streamName),
            method: 'GET',
            json: true,
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json"
            },
            timeout: config.timeout
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return true;
        }).catch(err => {
            if (err.statusCode !== 404) return Promise.reject(err);
            return false;
        });
    });
};