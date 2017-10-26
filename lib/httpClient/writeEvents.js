import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:writeEvents');
const baseErr = 'Write Events - ';

export default (config) => {
    const buildUrl = streamName => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${streamName}`;
        return url.format(urlObj);
    };

    return async(streamName, events, options) => {
        assert(streamName, `${baseErr}Stream Name not provided`);
        assert(events, `${baseErr}Events not provided`);
        assert.equal(true, events.constructor === Array, `${baseErr}Events should be an array`);

        if (events.length === 0) return;

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
    };
};