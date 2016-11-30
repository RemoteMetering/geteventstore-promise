var debug = require('debug')('geteventstore:disableAllProjections'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    _ = require('lodash');

module.exports = function(config) {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    var stopProjection = require('./stop')(config);

    return function() {
        return getAllProjectionsInfo().then(function(projectionsInfo) {
            return Promise.map(projectionsInfo.projections, function(projection) {
                return stopProjection(projection.name);
            });
        });
    };
};