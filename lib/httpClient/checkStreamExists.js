const debug = require('debug')('geteventstore:checkStreamExists');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const url = require('url');

const baseErr = 'Check Stream Exists - ';

module.exports = config => {
    const buildUrl = streamName => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${streamName}/head/backward/1`;
        return url.format(urlObj);
    };

    return streamName => Promise.resolve().then(() => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        const options = {
            uri: buildUrl(streamName),
            method: 'GET',
            json: true,
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json"
            },
            timeout: config.timeout
        };

        debug('', 'Options: %j', options);
        return req(options).then(response => {
            debug('', 'Response: %j', response);
            return true;
        }).catch(err => {
            if (err.statusCode !== 404) return Promise.reject(err);
            return false;
        });
    });
};