var debug = require('debug')('geteventstore:getAllSubscriptionsInfo');
var req = require('request-promise');
var url = require('url');

module.exports = config => {
    var buildUrl = () => {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/subscriptions';
        return url.format(urlObj);
    };

    return () => {
        var options = {
            uri: buildUrl(),
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
    };
};