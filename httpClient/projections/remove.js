var debug = require('debug')('geteventstore:removeProjection'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    url = require('url');

var baseErr = 'Remove Projection - ';

module.exports = function(config) {
    var buildUrl = function(name) {
        var urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}`;
        return url.format(urlObj);
    };

    return function(name, deleteCheckpointStream, deleteStateStream) {
        return Promise.resolve().then(function() {
            assert(name, `${baseErr}Name not provided`);

            deleteCheckpointStream = deleteCheckpointStream || false;
            deleteStateStream = deleteStateStream || false;

            var options = {
                uri: buildUrl(name),
                method: 'DELETE',
                qs: {
                    deleteCheckpointStream: deleteCheckpointStream ? 'yes' : 'no',
                    deleteStateStream: deleteStateStream ? 'yes' : 'no'
                }
            };

            debug('', 'Options: %j', options);
            return req(options).then(function(response) {
                debug('', 'Response: %j', response);
                return JSON.parse(response);
            });
        });
    };
};