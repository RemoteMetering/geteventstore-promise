const debug = require('debug')('geteventstore:writeEvents');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const url = require('url');

const baseErr = 'Write Events - ';

module.exports = config => {
    const buildUrl = streamName => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${streamName}`;
        return url.format(urlObj);
    };

    return (streamName, events, options) => Promise.resolve().then(() => {
        assert(streamName, `${baseErr}Stream Name not provided`);
        assert(events, `${baseErr}Events not provided`);
        assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

        if (events.length === 0)
            return;

        options = options || {};
        options.expectedVersion = options.expectedVersion || -2;

        const reqOptions = {
            uri: buildUrl(streamName),
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json",
                "ES-ExpectedVersion": options.expectedVersion
            },
            method: 'POST',
            body: events,
            json: true,
            timeout: config.timeout
        };
        debug('', 'Write events: %j', reqOptions);
        return req(reqOptions);
    });
};