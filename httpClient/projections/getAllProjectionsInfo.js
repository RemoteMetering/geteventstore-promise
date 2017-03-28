var debug = require('debug')('geteventstore:getAllProjectionsInfo'),
    req = require('request-promise'),
    url = require('url');

module.exports = config => {
    var buildUrl = () => {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projections/all-non-transient';
        return url.format(urlObj);
    };

    return () => {
        var options = {
            uri: buildUrl(),
            method: 'GET'
        };

        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return JSON.parse(response);
        });
    };
};