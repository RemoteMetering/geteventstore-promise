import { createConnection } from 'node-eventstore-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';
import https from 'https';

const debug = debugModule('geteventstore:connectionManager');
const _uniqueConfigConnectionPools = [];

// TODO: Remove terrible temporary hack till workaround can be found or tcp library support is added 
const connectWithoutValidation = async (client) => {
	const httpsRejectUnauthorizedPriorValue = https.globalAgent.options.rejectUnauthorized;
	try {
		https.globalAgent.options.rejectUnauthorized = false;
		await client.connect();
	} finally {
		https.globalAgent.options.rejectUnauthorized = httpsRejectUnauthorizedPriorValue;
	}
};

const createConnectionPool = async (config, onConnected, isSubscription) => {
	const opts = config.poolOptions || { autostart: false };
	if (isSubscription) {
		opts.min = 0;
		opts.max = 1;
	}

	const connectionPool = {
		config,
		onConnected,
		pool: genericPool.createPool({
			async create() {
				const client = createConnection(config, (config.gossipSeeds || `${config.protocol}://${config.hostname}:${config.port}`), config.connectionNameGenerator && await config.connectionNameGenerator());
				// TODO: remove temporary hack when tcp library supports https
				if (config.useSslConnection) client._endpointDiscoverer._httpService = https;

				if (isSubscription) {
					connectionPool.connectionName = client._connectionName;
					_uniqueConfigConnectionPools.push(connectionPool);
				}

				client.releaseConnection = () => connectionPool.pool.release(client);
				if (onConnected) {
					client.once('connected', () => {
						debug('', `${client._connectionName} - Connection Connected`);
						return onConnected();
					});
				} else {
					client.on('connected', () => debug('', `${client._connectionName} - Connection Connected`));
				}
				client.on('disconnected', () => debug('', `${client._connectionName} - Connection Disconnected`));
				client.on('reconnecting', () => debug('', `${client._connectionName} - Connection Reconnecting...`));
				client.on('closed', reason => {
					debug('', `${client._connectionName} - Connection Closed: ${reason}`);
					connectionPool.pool.destroy(client).catch(() => {}); //Do Nothing
				});
				client.on('error', err => {
					debug('', `${client._connectionName} - Connection Error: ${err.stack}`);
					console.error(`${client._connectionName} - EventStore: ${err.stack}`);
					try {
						this.destroy(client);
					} catch (ex) {
						//Do nothing
					}
				});

				if (config.useSslConnection && !config.validateServer) await connectWithoutValidation(client);
				else await client.connect();

				return client;
			},
			destroy(client) {
				return client.close();
			}
		}, opts)
	};

	if (!isSubscription) _uniqueConfigConnectionPools.push(connectionPool);
	return connectionPool;
};

export default {
	async create(config, onConnected, isSubscription = false) {
		let connectionPool = _uniqueConfigConnectionPools.find(pool => pool.config === config && pool.onConnected === onConnected);
		if (!connectionPool || isSubscription) connectionPool = await createConnectionPool(config, onConnected, isSubscription);
		return connectionPool.pool.acquire();
	},
	async closeAllPools() {
		await Promise.all(_uniqueConfigConnectionPools.map(connectionPool => connectionPool.pool.clear()));
		_uniqueConfigConnectionPools.splice(0, _uniqueConfigConnectionPools.length);
	},
	close(config) {
		return async (connectionName) => {
			const pool = await this.getPool(config)(connectionName);
			await pool.drain();
			await pool.clear();

			const poolIndex = _uniqueConfigConnectionPools.findIndex(_connectionPool => _connectionPool.pool === pool);
			if (poolIndex !== -1) _uniqueConfigConnectionPools.splice(poolIndex, 1);
		};
	},
	getPool(config) {
		return async (connectionName) => {
			const connectionPool = _uniqueConfigConnectionPools.find(pool => pool.config === config || (pool.connectionName && pool.connectionName === connectionName));
			if (!connectionPool) throw new Error(`Connection Pool not found`);
			return connectionPool.pool;
		};
	}
};