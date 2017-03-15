var Promise = require('bluebird');

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