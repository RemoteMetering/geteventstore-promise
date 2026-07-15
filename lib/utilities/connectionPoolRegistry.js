// Shared pool bookkeeping for the TCP and gRPC connection managers. Each
// transport creates its own registry and keeps its transport-specific pool factory.
export default () => {
	const configPools = new Map();
	const subscriptionPools = [];

	const getPool = (config) => async (connectionName) => {
		const connectionPool = configPools.get(config) || subscriptionPools.find(pool => pool.config === config || (pool.connectionName && pool.connectionName === connectionName));
		if (!connectionPool) throw new Error(`Connection Pool not found`);
		return connectionPool.pool;
	};

	return {
		configPools,
		subscriptionPools,
		getPool,
		async closeAllPools() {
			const allPools = [...configPools.values(), ...subscriptionPools];
			await Promise.all(allPools.map(connectionPool => connectionPool.pool.clear()));
			configPools.clear();
			subscriptionPools.length = 0;
		},
		close(config) {
			return async (connectionName) => {
				const pool = await getPool(config)(connectionName);
				await pool.drain();
				await pool.clear();

				for (const [key, connectionPool] of configPools) {
					if (connectionPool.pool === pool) configPools.delete(key);
				}
				const subIndex = subscriptionPools.findIndex(connectionPool => connectionPool.pool === pool);
				if (subIndex !== -1) subscriptionPools.splice(subIndex, 1);
			};
		}
	};
};
