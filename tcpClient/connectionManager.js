var debug = require('debug')('geteventstore:connectionManager');
var esClient = require('eventstore-node');
var Promise = require('bluebird');
var assert = require('assert');

var connection;

var create = function(config) {
	return Promise.resolve().then(function() {
		assert(config.hostname, 'Hostname not provided');
		assert(config.port, 'Port not provided');
		if (connection) return connection;
		var esConnection = esClient.EventStoreConnection.create(config, `tcp://${config.hostname}:${config.port}`);
		esConnection.on('closed', function(reason) {
			debug('', 'Connection Closed:', reason);
			if (esConnection === connection) {
				connection = undefined;
			}
		});
		esConnection.on('error', function(err) {
			console.error(err);
			if (esConnection === connection) connection = undefined;
			try {
				esConnection.close();
			} catch (ex) {}
		});
		return esConnection.connect().then(function() {
			connection = esConnection;
			return esConnection;
		}).catch(function(err) {
			connection = undefined;
			throw err;
		});
	});
};

var closeAll = function() {
	return new Promise(function(resolve, reject) {
		if (!connection) return resolve();

		let tempConnection = connection;
		connection.on('closed', function(reason) {
			debug('', 'Connection Closed:', reason);
			if (tempConnection && tempConnection === connection) {
				connection = undefined;
			}
			resolve();
		});
		connection.on('error', function(err) {
			if (tempConnection && tempConnection === connection) {
				connection = undefined;
			}
			try {
				tempConnection.close();
			} catch (ex) {}
			reject(err);
		});
		connection.close();
	});
};

var getConnections = function() {
	return Promise.resolve().then(function() {
		if (!connection) return [];
		return [connection];
	});
};

module.exports = {
	create: create,
	closeAll: closeAll,
	getConnections: getConnections
};