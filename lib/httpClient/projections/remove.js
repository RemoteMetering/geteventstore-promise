import req from 'request-promise';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:removeProjection');
const baseErr = 'Remove Projection - ';

module.exports = config => {
    const buildUrl = name => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}`;
        return url.format(urlObj);
    };

    return (name, deleteCheckpointStream, deleteStateStream) => Promise.resolve().then(() => {
        assert(name, `${baseErr}Name not provided`);

        deleteCheckpointStream = deleteCheckpointStream || false;
        deleteStateStream = deleteStateStream || false;

        const options = {
            uri: buildUrl(name),
            method: 'DELETE',
            qs: {
                deleteCheckpointStream: deleteCheckpointStream ? 'yes' : 'no',
                deleteStateStream: deleteStateStream ? 'yes' : 'no'
            }
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return JSON.parse(response);
        });
    });
};