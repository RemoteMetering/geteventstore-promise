const debug = require('debug')('geteventstore:getProjectionState');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const _ = require('lodash');
const url = require('url');

const baseErr = 'Get Projection State - ';

module.exports = config => {
    const buildUrl = name => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/projection/${name}/state`;
        return url.format(urlObj);
    };

    return (name, options) => Promise.resolve().then(() => {
        assert(name, `${baseErr}Name not provided`);

        const qs = {};
        options = options || {};

        if (!_.isEmpty(options.partition)) qs.partition = options.partition;
        const urlOptions = {
            uri: buildUrl(name),
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json"
            },
            method: 'GET',
            json: true,
            qs
        };

        debug('', 'Options: %j', options);
        return req(urlOptions).then(response => {
            debug('', 'Response: %j', response);
            return response;
        });
    });
};