const debug = require('debug')('geteventstore:ping'),
    req = require('request-promise'),
    url = require('url');

module.exports = config => {
    const buildUrl = () => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/ping';
        return url.format(urlObj);
    };

    return () => {
        const options = {
            uri: buildUrl(),
            method: 'GET',
            timeout: config.timeout
        };
        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    };
};