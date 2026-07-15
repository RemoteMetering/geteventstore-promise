import connectionPoolRegistry from '../utilities/connectionPoolRegistry.js';
import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import genericPool from 'generic-pool';

const registry = connectionPoolRegistry();

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
					registry.subscriptionPools.push(connectionPool);
				}

				client.releaseConnection = () => connectionPool.pool.release(client);

				return client;
			},
			destroy(client) {
				return client.dispose();
			}
		}, opts)
	};

	if (!isSubscription) registry.configPools.set(config, connectionPool);
	return connectionPool;
};

export default {
	async create(config, isSubscription = false) {
		let connectionPool = isSubscription ? undefined : registry.configPools.get(config);
		if (!connectionPool) connectionPool = await createConnectionPool(config, isSubscription);

		return await connectionPool.pool.acquire();
	},
	closeAllPools: registry.closeAllPools,
	close: registry.close,
	getPool: registry.getPool
};
