var Promise = require('bluebird');

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