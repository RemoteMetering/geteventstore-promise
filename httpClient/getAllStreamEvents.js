const debug = require('debug')('geteventstore:getAllStreamEvents'),
    req = require('request-promise'),
    Promise = require('bluebird'),
    assert = require('assert'),
    _ = require('lodash'),
    url = require('url');

const baseErr = 'Get All Stream Events - ';

module.exports = config => {
    const buildUrl = (stream, startPosition, chunkSize) => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${stream}/${startPosition}/forward/${chunkSize}`;
        return url.format(urlObj);
    };

    const buildOptions = (streamName, startPosition, chunkSize, resolveLinkTos) => ({
        uri: buildUrl(streamName, startPosition, chunkSize),
        method: 'GET',

        headers: {
            "Content-Type": "application/vnd.eventstore.events+json",
            "ES-ResolveLinkTos": resolveLinkTos.toString()
        },

        qs: {
            embed: 'body'
        },

        json: true,
        timeout: config.timeout
    });

    return (streamName, chunkSize, startPosition, resolveLinkTos) => new Promise((resolve, reject) => {
        assert(streamName, `${baseErr}Stream Name not provided`);

        startPosition = startPosition || 0;
        chunkSize = chunkSize || 1000;
        resolveLinkTos = resolveLinkTos === undefined ? true : resolveLinkTos;

        if (chunkSize > 4096) {
            console.warn('WARNING: Max event chunk size exceeded. Using the max of 4096');
            chunkSize = 4096;
        }

        let events = [];

        function getNextChunk() {
            const options = buildOptions(streamName, startPosition, chunkSize, resolveLinkTos);

            return req(options).then(response => {
                debug('', 'Result: %j', response);

                response.entries.forEach(entry => {
                    if (entry.data) entry.data = JSON.parse(entry.data);
                });

                events.push(response.entries.reverse());

                if (response.headOfStream === true) {
                    events = _.flatten(events);
                    return resolve(events);
                }

                startPosition += chunkSize;
                return getNextChunk();
            }).catch(reject);
        }

        getNextChunk();
    });
};