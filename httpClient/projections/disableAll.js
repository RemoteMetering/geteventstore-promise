var debug = require('debug')('geteventstore:disableAllProjections'),
    req = require('request-promise'),
    q = require('q'),
    _ = require('underscore');

module.exports = function(config) {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    var stopProjection = require('./stop')(config);

    return function() {
        var disablePromises = [];
        return getAllProjectionsInfo().then(function(projectionsInfo) {
            _.each(projectionsInfo.projections, function(projection) {
                disablePromises.push(stopProjection(projection.name))
            });
            return q.allSettled(disablePromises);
        });
    };
};