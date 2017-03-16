var esClient = require('eventstore-node');
var Promise = require('bluebird');
var assert = require('assert');

let connection;

var create = function(config) {
	return Promise.resolve().then(() => {
		assert(config.hostname, 'Hostname not provided');
		assert(config.port, 'Port not provided');
		if (connection) return connection;
		var esConnection = esClient.EventStoreConnection.create(config, `tcp://${config.hostname}:${config.port}`);
		return esConnection.connect().then(() => {
			connection = esConnection;
			return esConnection;
		}).catch(err => {
			connection = undefined;
			throw err;
		});
	});
};

var closeAll = function() {
	return Promise.resolve().then(() => {
		if (!connection) return;
		return connection.close();
	});
};

var getConnections = function() {
	if (!connection) return [];
	return [connection];
};

module.exports = {
	create: create,
	closeAll: closeAll,
	getConnections: getConnections
};