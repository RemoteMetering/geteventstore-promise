import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import url from 'url';

const debug = debugModule('geteventstore:removePersistentSubscription');
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

export default (config) => async(name, streamName) => {
    assert(name, `${baseErr}Persistent Subscription Name not provided`);
    assert(streamName, `${baseErr}Stream Name not provided`);

    const options = createRemoveRequest(name, streamName, config);
    debug('', 'Options: %j', options);
    const response = await req(options);
    debug('', 'Response: %j', response);
    return response;
};