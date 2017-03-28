const debug = require('debug')('geteventstore:removePersistentSubscription');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const url = require('url');

const baseErr = 'Remove persistent subscriptions - ';

const createRemoveRequest = (name, streamName, config) => {
    const urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = `/subscriptions/${streamName}/${name}`;

    const uri = url.format(urlObj);

    const request = {
        uri,
        method: 'DELETE',
        json: true
    };
    return request;
};

module.exports = config => (name, streamName) => Promise.resolve().then(() => {
    assert(name, `${baseErr}Persistent Subscription Name not provided`);
    assert(streamName, `${baseErr}Stream Name not provided`);

    const options = createRemoveRequest(name, streamName, config);
    debug('', 'Options: %j', options);
    return req(options).then(response => {
        debug('', 'Response: %j', response);
        return response;
    });
});