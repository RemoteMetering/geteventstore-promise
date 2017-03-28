var Promise = require('bluebird');

module.exports = config => {
    var getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    var startProjection = require('./start')(config);

    return () => getAllProjectionsInfo().then(projectionsInfo => Promise.map(projectionsInfo.projections, projection => startProjection(projection.name)));
};