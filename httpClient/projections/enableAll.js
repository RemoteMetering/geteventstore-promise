const Promise = require('bluebird');

module.exports = config => {
    const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    const startProjection = require('./start')(config);

    return () => getAllProjectionsInfo().then(projectionsInfo => Promise.map(projectionsInfo.projections, projection => startProjection(projection.name)));
};