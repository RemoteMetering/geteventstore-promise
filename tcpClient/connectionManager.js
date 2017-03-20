var debug = require('debug')('geteventstore:connectionManager');
var esClient = require('eventstore-node');
var Promise = require('bluebird');
var assert = require('assert');

var waitDelay = 50;
var connection;
var isConnecting = false;

var create = function(config) {
	return Promise.resolve().then(function() {
		assert(config.hostname, 'Hostname not provided');
		assert(config.port, 'Port not provided');

		if (connection && !isConnecting) return connection;
		else if (isConnecting) {
			return Promise.delay(waitDelay).then(function() {
				return create(config);
			});
		}

		isConnecting = true;
		var esConnection = esClient.EventStoreConnection.create(config, `tcp://${config.hostname}:${config.port}`);
		esConnection.on('closed', function(reason) {
			debug('', 'Connection Closed:', reason);
			if (esConnection === connection) {
				isConnecting = false;
				connection = undefined;
			}
		});
		esConnection.on('error', function(err) {
			console.error(err);
			if (esConnection === connection) connection = undefined;
			try {
				isConnecting = false;
				esConnection.close();
			} catch (ex) {}
		});
		esConnection.on('connected', function() {
			debug('', 'Connection Connected:');
		});
		return esConnection.connect().then(function() {
			connection = esConnection;
			isConnecting = false;
			return esConnection;
		}).catch(function(err) {
			connection = undefined;
			isConnecting = false;
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
		connection.on('connected', function() {
			debug('', 'Connection Connected:');
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