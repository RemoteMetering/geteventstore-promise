import req from 'request-promise';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:stopProjection');
const baseErr = 'Stop Projection - ';

export default (config) => {
    const buildUrl = (name) => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}/command/disable`;
        return url.format(urlObj);
    };

    return async(name) => {
        assert(name, `${baseErr}Name not provided`);

        const options = {
            uri: buildUrl(name),
            method: 'POST',
            json: true
        };

        debug('', 'Options: %j', options);
        const response = await req(options);
        debug('', 'Response: %j', response);
        return response;
    };
};