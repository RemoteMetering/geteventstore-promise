const debug = require('debug')('geteventstore:subscribeToStream');
const createConnection = require('./createConnection');
const Promise = require('bluebird');
const assert = require('assert');

const baseErr = 'Subscribe to Stream - ';

module.exports = config => (streamName, onEventAppeared, onConfirmed, onDropped, resolveLinkTos) => new Promise((resolve, reject) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    resolveLinkTos = resolveLinkTos || false;

    const connection = createConnection(config, reject);
    const subscription = connection.subscribeToStream(streamName, resolveLinkTos, onEventAppeared, onConfirmed, onDropped, config.credentials);
    debug('', 'Subscription: %j', subscription);
    resolve(connection);
});