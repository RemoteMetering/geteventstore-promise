var debug = require('debug')('geteventstore:getStreamSubscriptionsInfo');
var req = require('request-promise');
var Promise = require('bluebird');
var assert = require('assert');
var url = require('url');

var baseError = 'Get Stream Subscriptions Info - ';

module.exports = config => {
    var buildUrl = stream => {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/subscriptions/${stream}`;
        return url.format(urlObj);
    };

    return stream => Promise.resolve().then(() => {
        assert(stream, `${baseError}Stream not provided`);
        var options = {
            uri: buildUrl(stream),
            method: 'GET',
            json: true,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    });
};