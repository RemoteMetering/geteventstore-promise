import Promise from 'bluebird';

export default (config) => {
    const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    const stopProjection = require('./stop')(config);
    return () => getAllProjectionsInfo().then(projectionsInfo => Promise.map(projectionsInfo.projections, projection => stopProjection(projection.name)));
};