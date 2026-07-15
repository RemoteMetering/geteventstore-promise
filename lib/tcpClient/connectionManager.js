import connectionPoolRegistry from '../utilities/connectionPoolRegistry.js';
import { createConnection } from 'node-eventstore-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';
import https from 'https';

const debug = debugModule('metronomic-kurrentdb-client:connectionManager');

const registry = connectionPoolRegistry();

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
					registry.subscriptionPools.push(connectionPool);
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

	if (!isSubscription) registry.configPools.set(config, connectionPool);
	return connectionPool;
};

export default {
	async create(config, onConnected, isSubscription = false) {
		let connectionPool = isSubscription ? undefined : registry.configPools.get(config);
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
	closeAllPools: registry.closeAllPools,
	close: registry.close,
	getPool: registry.getPool
};
