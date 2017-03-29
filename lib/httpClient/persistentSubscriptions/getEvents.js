const debug = require('debug')('geteventstore:getEventsPersistentSubscription');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const _ = require('lodash');
const url = require('url');

const baseErr = 'Get persistent subscriptions events - ';

const createRequest = (name, streamName, count, embed, config) => {
    const urlObj = JSON.parse(JSON.stringify(config));
    urlObj.pathname = `/subscriptions/${streamName}/${name}/${count}?embed=${embed}`;

    const uri = url.format(urlObj);
    const request = {
        uri,
        method: 'GET',
        json: true,
        headers: {
            'Accept': 'application/vnd.eventstore.competingatom+json',
        }
    };
    return request;
};

const postUrl = uri => () => {
    const postRequest = {
        uri,
        method: 'POST',
        json: true,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    return req(postRequest);
};

const appendLinkFunctions = (resultObject, links) => {
    _.each(links, link => {
        resultObject[link.relation] = postUrl(link.uri);
    });
};

const buildResultObject = response => {
    debug('', 'Response: %j', response);
    const result = {
        entries: []
    };

    appendLinkFunctions(result, response.links);

    result.entries = _.map(response.entries, entry => {
        if (entry.data) entry.data = JSON.parse(entry.data);

        const formattedEntry = {
            event: entry
        };
        appendLinkFunctions(formattedEntry, entry.links);
        return formattedEntry;
    });

    debug('', 'Result: %j', result);
    return result;
};

module.exports = config => (name, streamName, count, embed) => Promise.resolve().then(() => {
    assert(name, `${baseErr}Persistent Subscription Name not provided`);
    assert(streamName, `${baseErr}Stream Name not provided`);

    count = count === undefined ? 1 : count;
    embed = embed || 'Body';

    const options = createRequest(name, streamName, count, embed, config);
    debug('', 'Options: %j', options);
    return req(options).then(buildResultObject);
});