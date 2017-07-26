const debug = require('debug')('geteventstore:getEvents');
const req = require('request-promise');
const Promise = require('bluebird');
const assert = require('assert');
const url = require('url');

const baseErr = 'Get Events - ';

module.exports = config => {
    const buildUrl = (stream, startPosition, length, direction) => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${stream}/${startPosition}/${direction}/${length}`;
        return url.format(urlObj);
    };

    return (streamName, startPosition, length, direction, resolveLinkTos, embed = 'body') => Promise.resolve().then(() => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        length = length || 1000;

        if (length > 4096) {
            console.warn('WARNING: Max event return limit exceeded. Using the max of 4096');
            length = 4096;
        }

        direction = direction || 'forward';
        startPosition = startPosition === undefined && direction === 'backward' ? 'head' : startPosition || 0;
        resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

        const options = {
            uri: buildUrl(streamName, startPosition, length, direction),
            method: 'GET',
            headers: {
                "Content-Type": "application/vnd.eventstore.events+json",
                "ES-ResolveLinkTos": resolveLinkTos.toString()
            },
            qs: {
                embed
            },
            json: true,
            timeout: config.timeout
        };

        debug('', 'Options: ', options);
        return req(options).then(response => {
            if (embed === 'body') {
                let totalEntries = response.entries.length;
                for (let i = 0; i < totalEntries; i++) {
                    if (response.entries[i].data) response.entries[i].data = JSON.parse(response.entries[i].data);
                }
            }

            if (direction === 'forward')
                return response.entries.reverse();

            return response.entries;
        });
    });
};