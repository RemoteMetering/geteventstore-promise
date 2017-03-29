const debug = require('debug')('geteventstore:sendScavengeCommand');
const req = require('request-promise');
const url = require('url');

module.exports = config => {
    const buildUrl = () => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/admin/scavenge';
        return url.format(urlObj);
    };

    return () => {
        const options = {
            uri: buildUrl(),
            method: 'POST'
        };

        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    };
};