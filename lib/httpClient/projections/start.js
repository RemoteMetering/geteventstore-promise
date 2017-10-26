import req from 'request-promise';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:startProjection');
const baseErr = 'Start Projection - ';

export default (config) => {
    const buildUrl = name => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}/command/enable`;
        return url.format(urlObj);
    };

    return name => Promise.resolve().then(() => {
        assert(name, `${baseErr}Name not provided`);

        const options = {
            uri: buildUrl(name),
            method: 'POST'
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return JSON.parse(response);
        });
    });
};