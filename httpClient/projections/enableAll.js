var debug = require('debug')('geteventstore:enableAllProjections'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    _ = require('lodash');

module.exports = function(config) {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    var startProjection = require('./start')(config);

    return function() {
        return getAllProjectionsInfo().then(function(projectionsInfo) {
            return Promise.map(projectionsInfo.projections, function(projection) {
                return startProjection(projection.name);
            });
        });
    };
};