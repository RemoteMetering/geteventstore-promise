const debug = require('debug')('geteventstore:subscribeToStream'), createConnection = require('./createConnection'), Promise = require('bluebird'), assert = require('assert');

const baseErr = 'Subscribe to Stream - ';

module.exports = config => (streamName, onEventAppeared, onConfirmed, onDropped, resolveLinkTos) => new Promise((resolve, reject) => {
    assert(streamName, `${baseErr}Stream Name not provided`);

    resolveLinkTos = resolveLinkTos || false;

    const connection = createConnection(config, reject);
    const subscription = connection.subscribeToStream(streamName, resolveLinkTos, onEventAppeared, onConfirmed, onDropped, config.credentials);
    debug('', 'Subscription: %j', subscription);
    resolve(connection);
});