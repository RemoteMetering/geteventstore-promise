var debug = require('debug')('geteventstore:assertProjection'),
    req = require('request-promise'),
    _ = require('underscore'),
    q = require('q');


var doesProjectionExist = function(config, name) {
    return q().then(function() {
        var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
        return getAllProjectionsInfo().then(function(projectionsInfo) {
            var projection = _.find(projectionsInfo.projections, function(projection) {
                return projection.name === name;
            });

            if (projection)
                return true;

            return false;
        });
    });
};

var buildCreateOptions = function(config, name, projectionContent, mode, enabled, emitEnabled, checkpointsEnabled) {
    var uri = 'http://' + config.http.credentials.username + ':' + config.http.credentials.password + '@' + config.http.hostname + ':' + config.http.port + '/projections/' + mode;

    var options = {
        uri: uri,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        qs: {
            name: name,
            enabled: enabled ? 'yes' : 'no',
            emit: emitEnabled ? 'yes' : 'no',
            checkpoints: checkpointsEnabled ? 'yes' : 'no',
        },
        body: projectionContent
    };

    return options;
};

var buildUpdateOptions = function(config, name, projectionContent, emitEnabled) {
    var uri = 'http://' + config.http.credentials.username + ':' + config.http.credentials.password + '@' + config.http.hostname + ':' + config.http.port + '/projection/' + name + '/query';

    var options = {
        uri: uri,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        qs: {
            emit: emitEnabled ? 'yes' : 'no',
        },
        body: projectionContent
    };

    return options;
};

module.exports = function(config) {
    return function(name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled) {
        mode = mode || 'continuous';
        enabled = enabled || true;
        checkpointsEnabled = mode == 'continuous' ? true : checkpointsEnabled || false;
        emitEnabled = emitEnabled || false;

        return doesProjectionExist(config, name).then(function(projectionExists) {
            debug('Projection Exists', projectionExists);
            var options = {};

            if (!projectionExists)
                options = buildCreateOptions(config, name, projectionContent, mode, enabled, emitEnabled, checkpointsEnabled);
            else
                options = buildUpdateOptions(config, name, projectionContent, emitEnabled);

            debug('Options', options);
            return req(options).then(function(response) {
                debug('Response', response);
                return JSON.parse(response);
            });
        });
    };
};