const debug = require('debug')('geteventstore:getStreamSubscriptionsInfo');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const url = require('url');

const baseError = 'Get Stream Subscriptions Info - ';

module.exports = config => {
    const buildUrl = stream => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/subscriptions/${stream}`;
        return url.format(urlObj);
    };

    return stream => Promise.resolve().then(() => {
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
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    });
};