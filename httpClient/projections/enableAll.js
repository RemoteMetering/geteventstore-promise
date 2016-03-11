var debug = require('debug')('geteventstore:enableAllProjections'),
    req = require('request-promise'),
    q = require('q'),
    _ = require('underscore');

module.exports = function(config) {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    var startProjection = require('./start')(config);

    return function() {
        var enablePromises = [];
        return getAllProjectionsInfo().then(function(projectionsInfo) {
            _.each(projectionsInfo.projections, function(projection) {
                enablePromises.push(startProjection(projection.name))
            });
            return q.allSettled(enablePromises);
        });
    };
};