var debug = require('debug')('geteventstore:getAllSubscriptionsInfo');
var req = require('request-promise');
var url = require('url');

module.exports = function(config) {
    var buildUrl = function() {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = '/subscriptions';
        return url.format(urlObj);
    };

    return function() {
        var options = {
            uri: buildUrl(),
            method: 'GET',
            json: true,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        debug('', 'Options: ' + JSON.stringify(options));
        return req(options).then(function(response) {
            debug('', 'Response: ' + JSON.stringify(response));
            return response;
        });
    };
};