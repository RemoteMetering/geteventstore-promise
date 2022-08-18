import { EventStoreDBClient } from '@eventstore/db-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';

const debug = debugModule('geteventstore:connectionManager');
const _uniqueConfigConnectionPools = [];

const createConnectionPool = async (config, isSubscription) => {
	const opts = config.poolOptions || { autostart: false };
	if (isSubscription) {
		opts.min = 0;
		opts.max = 1;
	}

	const connectionPool = {
		config,
		pool: genericPool.createPool({
			async create() {
				const connectionName = (config.connectionNameGenerator && await config.connectionNameGenerator()) || config.connectionName;
				const client = EventStoreDBClient.connectionString(`${config.protocol}://${config.gossipSeeds ? config.gossipSeeds.map(seed => `${seed.hostname}:${seed.port}`).join(',') : `${config.auth}@${config.host}:${config.port}`}?tls=${config.useSslConnection}${config.tlsCAFile ? `&tlsCAFile=${config.tlsCAFile}` : ''}${connectionName ? `&connectionName=${connectionName}` : ''}`);
				if (isSubscription) {
					connectionPool.connectionName = client.connectionName;
					_uniqueConfigConnectionPools.push(connectionPool);
				}

				client.releaseConnection = () => connectionPool.pool.release(client);

				return client;
			},
			destroy(client) {
				return client.dispose();
			}
		}, opts)
	};

	if (!isSubscription) _uniqueConfigConnectionPools.push(connectionPool);
	return connectionPool;
};

export default {
	async create(config, isSubscription = false) {
		let connectionPool = _uniqueConfigConnectionPools.find(pool => pool.config === config);
		if (!connectionPool || isSubscription) connectionPool = await createConnectionPool(config, isSubscription);

		return await connectionPool.pool.acquire();
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