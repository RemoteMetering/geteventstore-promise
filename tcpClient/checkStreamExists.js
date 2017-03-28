var connectionManager = require('./connectionManager'),
	esClient = require('eventstore-node'),
	Promise = require('bluebird'),
	assert = require('assert');

var baseErr = 'Check stream exits - ';

module.exports = function(config) {
	return function(streamName) {
		return Promise.resolve().then(function() {
			assert(streamName, `${baseErr}Stream Name not provided`);
			return connectionManager.create(config).then(function(connection) {
				return connection.readStreamEventsForward(streamName, 0, 1, true, config.credentials).then(slice => {
					if (slice.status === esClient.sliceReadStatus.StreamNotFound) return false;
					return true;
				});
			});
		});
	};
};