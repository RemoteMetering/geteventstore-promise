const debug = require('debug')('geteventstore:getAllProjectionsInfo'),
    req = require('request-promise'),
    url = require('url');

module.exports = config => {
    const buildUrl = () => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/projections/all-non-transient';
        return url.format(urlObj);
    };

    return () => {
        const options = {
            uri: buildUrl(),
            method: 'GET'
        };

        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return JSON.parse(response);
        });
    };
};