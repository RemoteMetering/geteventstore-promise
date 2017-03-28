var debug = require('debug')('geteventstore:connectionManager');
var esClient = require('eventstore-node');
var Promise = require('bluebird');
var assert = require('assert');

var waitDelay = 50;
var connection;
var isConnecting = false;

var create = config => Promise.resolve().then(() => {
    assert(config.hostname, 'Hostname not provided');
    assert(config.port, 'Port not provided');

    if (connection && !isConnecting) return connection;
    else if (isConnecting) {
        return Promise.delay(waitDelay).then(() => create(config));
    }

    isConnecting = true;
    var esConnection = esClient.EventStoreConnection.create(config, `tcp://${config.hostname}:${config.port}`);
    esConnection.on('disconnected', () => {
        debug('', 'Connection Disconnected');
    });
    esConnection.on('reconnecting', () => {
        debug('', 'Connection Reconnecting...');
    });
    esConnection.on('closed', reason => {
        debug('', 'Connection Closed:', reason);
        if (esConnection === connection) {
            isConnecting = false;
            connection = undefined;
        }
    });
    esConnection.on('error', err => {
        console.error(err);
        if (esConnection === connection) connection = undefined;
        try {
            isConnecting = false;
            esConnection.close();
        } catch (ex) {}
    });
    esConnection.on('connected', () => {
        debug('', 'Connection Connected');
    });
    return esConnection.connect().then(() => {
        connection = esConnection;
        isConnecting = false;
        return esConnection;
    }).catch(err => {
        connection = undefined;
        isConnecting = false;
        throw err;
    });
});

var closeAll = () => new Promise((resolve, reject) => {
    if (!connection) return resolve();

    let tempConnection = connection;
    connection.on('closed', reason => {
        debug('', 'Connection Closed:', reason);
        if (tempConnection && tempConnection === connection) {
            connection = undefined;
        }
        resolve();
    });
    connection.on('error', err => {
        if (tempConnection && tempConnection === connection) {
            connection = undefined;
        }
        try {
            tempConnection.close();
        } catch (ex) {}
        reject(err);
    });
    connection.on('connected', () => {
        debug('', 'Connection Connected:');
    });
    connection.close();
});

var getConnections = () => Promise.resolve().then(() => {
    if (!connection) return [];
    return [connection];
});

module.exports = {
	create,
	closeAll,
	getConnections
};