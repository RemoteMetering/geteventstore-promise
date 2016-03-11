var debug = require('debug')('geteventstore:removeProjection'),
    req = require('request-promise');

module.exports = function(config) {
    var buildUrl = function(name) {
        var url = 'http://' + config.http.credentials.username + ':' + config.http.credentials.password + '@' + config.http.hostname + ':' + config.http.port + '/projection/' + name;
        return url;
    };

    return function(name, deleteCheckpointStream, deleteStateStream) {
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

        debug('Options', options);
        return req(options).then(function(response) {
            debug('Response', response);
            return JSON.parse(response);
        });
    };
};