import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:connectionManager');
// Non-subscription pools are keyed by config object identity for O(1) lookup on
// the hot create() path. Subscription pools share their config so they cannot be
// keyed that way, they are kept in a separate list and looked up by connectionName.
const _configPools = new Map();
const _subscriptionPools = [];

const createConnectionPool = async (config, isSubscription) => {
	const opts = { autostart: false, min: 0, max: 5, ...(config.poolOptions || {}) };
	if (isSubscription) {
		opts.min = 0;
		opts.max = 1;
	}

	const connectionPool = {
		config,
		pool: genericPool.createPool({
			async create() {
				const connectionName = (config.connectionNameGenerator && await config.connectionNameGenerator()) || config.connectionName;
				const seedsString = config.gossipSeeds
					? `${config.auth}@${config.gossipSeeds.map(seed => `${seed.hostname}:${seed.port}`).join(',')}`
					: `${config.auth}@${config.host}:${config.port}`;
				const client = KurrentDBClient.connectionString(`${config.protocol}://${seedsString}?tls=${config.useSslConnection}${config.tlsCAFile ? `&tlsCAFile=${config.tlsCAFile}` : ''}${connectionName ? `&connectionName=${connectionName}` : ''}`);
				if (isSubscription) {
					connectionPool.connectionName = client.connectionName;
					_subscriptionPools.push(connectionPool);
				}

				client.releaseConnection = () => connectionPool.pool.release(client);

				return client;
			},
			destroy(client) {
				return client.dispose();
			}
		}, opts)
	};

	if (!isSubscription) _configPools.set(config, connectionPool);
	return connectionPool;
};

export default {
	async create(config, isSubscription = false) {
		let connectionPool = isSubscription ? undefined : _configPools.get(config);
		if (!connectionPool) connectionPool = await createConnectionPool(config, isSubscription);

		return await connectionPool.pool.acquire();
	},
	async closeAllPools() {
		const allPools = [..._configPools.values(), ..._subscriptionPools];
		await Promise.all(allPools.map(connectionPool => connectionPool.pool.clear()));
		_configPools.clear();
		_subscriptionPools.length = 0;
	},
	close(config) {
		return async (connectionName) => {
			const pool = await this.getPool(config)(connectionName);
			await pool.drain();
			await pool.clear();

			for (const [key, connectionPool] of _configPools) {
				if (connectionPool.pool === pool) _configPools.delete(key);
			}
			const subIndex = _subscriptionPools.findIndex(connectionPool => connectionPool.pool === pool);
			if (subIndex !== -1) _subscriptionPools.splice(subIndex, 1);
		};
	},
	getPool(config) {
		return async (connectionName) => {
			const connectionPool = _configPools.get(config) || _subscriptionPools.find(pool => pool.config === config || (pool.connectionName && pool.connectionName === connectionName));
			if (!connectionPool) throw new Error(`Connection Pool not found`);
			return connectionPool.pool;
		};
	}
};
