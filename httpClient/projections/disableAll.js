var Promise = require('bluebird');

module.exports = config => {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    var stopProjection = require('./stop')(config);

    return () => getAllProjectionsInfo().then(projectionsInfo => Promise.map(projectionsInfo.projections, projection => stopProjection(projection.name)));
};