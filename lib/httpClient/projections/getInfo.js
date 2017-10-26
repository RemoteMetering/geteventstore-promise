import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:getProjectionInfo');
const baseErr = 'Get Projection Info - ';

module.exports = config => {
    const getAllProjectionsInfo = require('./getAllProjectionsInfo')(config);

    return name => Promise.resolve().then(() => {
        assert(name, `${baseErr}Name not provided`);

        return getAllProjectionsInfo().then(projectionsInfo => {
            const projectionInfo = _.find(projectionsInfo.projections, projection => projection.name === name);
            debug('', 'Projection Info: %j', projectionInfo);
            return projectionInfo;
        });
    });
};