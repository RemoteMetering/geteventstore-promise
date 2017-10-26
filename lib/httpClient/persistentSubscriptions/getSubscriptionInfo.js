import req from 'request-promise';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:getSubscriptionInfo');
const baseError = 'Get Stream Subscriptions Info - ';

module.exports = config => {
    const buildUrl = (name, stream) => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/subscriptions/${stream}/${name}/info`;
        return url.format(urlObj);
    };

    return (name, stream) => Promise.resolve().then(() => {
        assert(name, `${baseError}Persistant Subscription Name not provided`);
        assert(stream, `${baseError}Stream not provided`);

        const options = {
            uri: buildUrl(name, stream),
            method: 'GET',
            json: true,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    });
};