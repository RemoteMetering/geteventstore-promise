var debug = require('debug')('geteventstore:resetProjection'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Reset Projection - ';

module.exports = config => {
    var buildUrl = name => {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}/command/reset`;
        return url.format(urlObj);
    };

    return name => Promise.resolve().then(() => {
        assert(name, `${baseErr}Name not provided`);

        var options = {
            uri: buildUrl(name),
            method: 'POST'
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return JSON.parse(response);
        });
    });
};