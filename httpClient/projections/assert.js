var debug = require('debug')('geteventstore:assertProjection'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash'),
    url = require('url');

var baseErr = 'Assert Projection - ';

var doesProjectionExist = (config, name) => Promise.resolve().then(() => {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    return getAllProjectionsInfo().then(projectionsInfo => {
        var projection = _.find(projectionsInfo.projections, projection => projection.name === name);

        if (projection)
            return true;

        return false;
    });
});

var buildCreateOptions = (
    config,
    name,
    projectionContent,
    mode,
    enabled,
    emitEnabled,
    checkpointsEnabled
) => {
    var urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = `/projections/${mode}`;
    var uri = url.format(urlObj);

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

var buildUpdateOptions = (config, name, projectionContent, emitEnabled) => {
    var urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = `/projection/${name}/query`;
    var uri = url.format(urlObj);

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

module.exports = config => (name, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled) => Promise.resolve().then(() => {
    assert(name, `${baseErr}Name not provided`);
    assert(projectionContent, `${baseErr}Projecion Contnet not provided`);

    mode = mode || 'continuous';
    enabled = enabled || true;
    checkpointsEnabled = mode === 'continuous' ? true : checkpointsEnabled || false;
    emitEnabled = emitEnabled || false;

    return doesProjectionExist(config, name).then(projectionExists => {
        debug('', 'Projection Exists: %j', projectionExists);
        var options = {};

        if (!projectionExists)
            options = buildCreateOptions(config, name, projectionContent, mode, enabled, emitEnabled, checkpointsEnabled);
        else
            options = buildUpdateOptions(config, name, projectionContent, emitEnabled);

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return JSON.parse(response);
        });
    });
});