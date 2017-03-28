var connectionManager = require('./connectionManager'),
	esClient = require('eventstore-node'),
	Promise = require('bluebird'),
	assert = require('assert');

var baseErr = 'Check stream exits - ';

module.exports = config => streamName => Promise.resolve().then(() => {
    assert(streamName, `${baseErr}Stream Name not provided`);
    return connectionManager.create(config).then(connection => connection.readStreamEventsForward(streamName, 0, 1, true, config.credentials).then(slice => {
        if (slice.status === esClient.sliceReadStatus.StreamNotFound) return false;
        return true;
    }));
});