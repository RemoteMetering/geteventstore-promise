var debug = require('debug')('geteventstore:getProjectionState'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash'),
    url = require('url');

var baseErr = 'Get Projection State - ';

module.exports = config => {
    var buildUrl = name => {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}/state`;
        return url.format(urlObj);
    };

    return (name, options) => Promise.resolve().then(() => {
        assert(name, `${baseErr}Name not provided`);

        var qs = {};
        options = options || {};

        if (!_.isEmpty(options.partition)) qs.partition = options.partition;
        var urlOptions = {
            uri: buildUrl(name),
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json"
            },
            method: 'GET',
            json: true,
            qs
        };

        debug('', 'Options: %j', options);
        return req(urlOptions).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    });
};