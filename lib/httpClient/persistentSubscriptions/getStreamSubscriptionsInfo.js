import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:getStreamSubscriptionsInfo');
const baseError = 'Get Stream Subscriptions Info - ';

export default (config) => {
    const buildUrl = stream => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/subscriptions/${stream}`;
        return url.format(urlObj);
    };

    return async(stream) => {
        assert(stream, `${baseError}Stream not provided`);
        const options = {
            uri: buildUrl(stream),
            method: 'GET',
            json: true,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        debug('', 'Options: %j', options);
        const response = await req(options);
        debug('', 'Response: %j', response);
        return response;
    };
};