import esClient from 'node-eventstore-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';
import Promise from 'bluebird';
import { find } from 'lodash';

const debug = debugModule('geteventstore:connectionManager');
let _uniqueConfigConnectionPools = [];

export default {
	async create(config, onConnected, isSubscription = false) {
		let connectionPool = find(_uniqueConfigConnectionPools, { config, onConnected });

		if (!connectionPool) {
			const opts = config.poolOptions || { autostart: false };
			if (isSubscription) {
				opts.min = 1;
				opts.max = 1;
			}

			const factory = {
				async create() {
					const client = await esClient.EventStoreConnection.create(config, (config.gossipSeeds || `${config.protocol}://${config.hostname}:${config.port}`));

					client.releaseConnection = () => connectionPool.pool.release(client);
					if (onConnected) {
						client.once('connected', onConnected);
					} else {
						client.on('connected', () => debug('', `${client._connectionName} - Connection Connected`));
					}
					client.on('disconnected', () => debug('', `${client._connectionName} - Connection Disconnected`));
					client.on('reconnecting', () => debug('', `${client._connectionName} - Connection Reconnecting...`));
					client.on('closed', reason => {
						debug('', `${client._connectionName} - Connection Closed: ${reason}`);
						factory.destroy(client);
					});
					client.on('error', err => {
						debug('', `${client._connectionName} - Connection Error: ${err.stack}`);
						console.error(`${client._connectionName} - EventStore: ${err.stack}`);
						try {
							factory.destroy(client);
						} catch (ex) {
							//Do nothing
						}
					});

					await client.connect();
					return client;
				},
				destroy(client) { return client.close(); }
			};

			connectionPool = {
				config,
				onConnected,
				pool: genericPool.createPool(factory, opts)
			};
			_uniqueConfigConnectionPools.push(connectionPool);
		}

		return connectionPool.pool.acquire();
	},
	async closeAllPools() {
		await Promise.all(_uniqueConfigConnectionPools.map(connectionPool => connectionPool.pool.clear()));
		_uniqueConfigConnectionPools.splice(0, _uniqueConfigConnectionPools.length);
	},
	close(config) {
		return async () => {
			const pool = await this.getPool(config)();
			await pool.clear();
			_uniqueConfigConnectionPools = _uniqueConfigConnectionPools.filter(_connectionPool => _connectionPool.pool !== pool);
		};
	},
	getPool(config) {
		return async () => {
			const connectionPool = find(_uniqueConfigConnectionPools, { config });
			if (!connectionPool) throw new Error(`Connection Pool not found`);
			return connectionPool.pool;
		};
	}
};