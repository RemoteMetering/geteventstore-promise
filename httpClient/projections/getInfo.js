var debug = require('debug')('geteventstore:getProjectionInfo'),
    _ = require('underscore'),
    url = require('url'),
    req = require('request-promise');

module.exports = function(config) {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    
    return function(name) {
        return getAllProjectionsInfo().then(function(projectionsInfo) {
            var projectionInfo = _.find(projectionsInfo.projections, function(projection) {
                return projection.name === name;
            });
            debug('Projection Info', projectionInfo);
            return projectionInfo;
        });
    };
};