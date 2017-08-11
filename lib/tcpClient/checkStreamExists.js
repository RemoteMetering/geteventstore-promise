const connectionManager = require('./connectionManager');
const esClient = require('node-eventstore-client');
const Promise = require('bluebird');
const assert = require('assert');

const baseErr = 'Check stream exits - ';

module.exports = config => streamName => Promise.resolve().then(() => {
    assert(streamName, `${baseErr}Stream Name not provided`);
    return connectionManager.create(config).then(connection => connection.readStreamEventsForward(streamName, 0, 1, true, config.credentials).then(slice => {
        if (slice.status === esClient.sliceReadStatus.StreamDeleted) return Promise.reject(new Error(`Stream hard deleted`));
        if (slice.status === esClient.sliceReadStatus.StreamNotFound) return false;
        return true;
    }));
});