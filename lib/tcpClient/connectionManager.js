import { createConnection } from 'node-eventstore-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';
import https from 'https';

const debug = debugModule('metronomic-kurrentdb-client:connectionManager');

const _configPools = new Map();
const _subscriptionPools = [];

const getPool = (config) => async (connectionName) => {
	const connectionPool = _configPools.get(config) || _subscriptionPools.find(pool => pool.config === config || (pool.connectionName && pool.connectionName === connectionName));
	if (!connectionPool) throw new Error(`Connection Pool not found`);
	return connectionPool.pool;
};

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

const isConnectionClosed = (client) => client._handler._state === 'closed';

const createConnectionPool = async (config, onConnected, isSubscription) => {
	const opts = { autostart: false, min: 0, max: 5, ...(config.poolOptions || {}) };
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
					_subscriptionPools.push(connectionPool);
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
					console.error(`${client._connectionName} - KurrentDB: ${err.stack}`);
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

	if (!isSubscription) _configPools.set(config, connectionPool);
	return connectionPool;
};

export default {
	async create(config, onConnected, isSubscription = false) {
		let connectionPool = isSubscription ? undefined : _configPools.get(config);
		if (!connectionPool) connectionPool = await createConnectionPool(config, onConnected, isSubscription);

		let client = await connectionPool.pool.acquire();
		//Handle closed connection when 'closed' event never emitted
		if (isConnectionClosed(client)) {
			try {
				await connectionPool.pool.destroy(client);
			} catch (err) {
				//do nothing
			}
			client = await connectionPool.pool.acquire();
		}
		return client;
	},
	async closeAllPools() {
		const allPools = [..._configPools.values(), ..._subscriptionPools];
		await Promise.all(allPools.map(connectionPool => connectionPool.pool.clear()));
		_configPools.clear();
		_subscriptionPools.length = 0;
	},
	close(config) {
		return async (connectionName) => {
			const pool = await getPool(config)(connectionName);
			await pool.drain();
			await pool.clear();

			for (const [key, connectionPool] of _configPools) {
				if (connectionPool.pool === pool) _configPools.delete(key);
			}
			const subIndex = _subscriptionPools.findIndex(connectionPool => connectionPool.pool === pool);
			if (subIndex !== -1) _subscriptionPools.splice(subIndex, 1);
		};
	},
	getPool
};
