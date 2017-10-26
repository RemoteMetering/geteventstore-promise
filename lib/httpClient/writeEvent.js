import eventFactory from '../eventFactory';
import req from 'request-promise';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:writeEvent');
const baseErr = 'Write Event - ';

export default (config) => {
    const buildUrl = streamName => {
        const urlObj = JSON.parse(JSON.stringify(config));
        urlObj.pathname = `/streams/${streamName}`;
        return url.format(urlObj);
    };

    return (streamName, eventType, data, metaData, options) => Promise.resolve().then(() => {
        assert(streamName, `${baseErr}Stream Name not provided`);
        assert(eventType, `${baseErr}Event Type not provided`);
        assert(data, `${baseErr}Event Data not provided`);

        options = options || {};
        options.expectedVersion = options.expectedVersion || -2;

        const events = [eventFactory.NewEvent(eventType, data, metaData)];

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
        debug('', 'Write Event: %j', reqOptions);
        return req(reqOptions);
    });
};