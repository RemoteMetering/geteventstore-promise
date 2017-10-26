import Promise from 'bluebird';

export default (config) => {
    const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);
    const startProjection = require('./start')(config);

    return async() => {
        const projectionsInfo = await getAllProjectionsInfo();
        return Promise.map(projectionsInfo.projections, projection => startProjection(projection.name));
    };
};