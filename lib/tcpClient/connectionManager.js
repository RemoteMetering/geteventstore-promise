import esClient from 'node-eventstore-client';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';

const debug = debugModule('geteventstore:connectionManager');
const WAIT_DELAY = 50;
let connection;
let isConnecting = false;

const create = async(config) => {
	assert(config.hostname, 'Hostname not provided');
	assert(config.port, 'Port not provided');

	if (connection && !isConnecting) return connection;
	else if (isConnecting) {
		return Promise.delay(WAIT_DELAY).then(() => create(config));
	}

	isConnecting = true;
	const esConnection = esClient.EventStoreConnection.create(config, `tcp://${config.hostname}:${config.port}`);

	esConnection.on('connected', () => debug('', 'Connection Connected'));
	esConnection.on('disconnected', () => debug('', 'Connection Disconnected'));
	esConnection.on('reconnecting', () => debug('', 'Connection Reconnecting...'));
	esConnection.on('closed', reason => {
		debug('', 'Connection Closed:', reason);
		if (esConnection === connection) {
			isConnecting = false;
			connection = undefined;
		}
	});
	esConnection.on('error', err => {
		debug('', 'Connection Error:', err.stack);
		console.error(`EventStore: ${err.stack}`);
		if (esConnection === connection) connection = undefined;
		try {
			isConnecting = false;
			esConnection.close();
		} catch (ex) {}
	});

	try {
		await esConnection.connect();
		connection = esConnection;
		isConnecting = false;
		return esConnection;
	} catch (err) {
		connection = undefined;
		isConnecting = false;
		throw err;
	}
};

const closeAll = () => new Promise((resolve, reject) => {
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

const getConnections = async() => {
	if (!connection) return [];
	return [connection];
};

export default {
	create,
	closeAll,
	getConnections
};