var debug = require('debug')('geteventstore:getProjectionInfo'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash'),
    url = require('url');

var baseErr = 'Get Projection Info - ';

module.exports = function(config) {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);

    return function(name) {
        return Promise.resolve().then(function() {
            assert(name, baseErr + 'Name not provided');

            return getAllProjectionsInfo().then(function(projectionsInfo) {
                var projectionInfo = _.find(projectionsInfo.projections, function(projection) {
                    return projection.name === name;
                });
                debug('', 'Projection Info: ' + JSON.stringify(projectionInfo));
                return projectionInfo;
            });
        });
    };
};