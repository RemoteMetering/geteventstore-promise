import esClient from 'node-eventstore-client';
import genericPool from 'generic-pool';
import debugModule from 'debug';
import Promise from 'bluebird';
import { find } from 'lodash';
import assert from 'assert';

const debug = debugModule('geteventstore:connectionManager');
let connection;

let _instances = [];

const closeAll = async () => {
	await Promise.all(_instances.map(instance => instance.pool.clear()));
	_instances.splice(0, _instances.length);
};

export default {
	async create(config) {
		assert(config.hostname, 'Hostname not provided');
		assert(config.port, 'Port not provided');

		let instance = find(_instances, { config });
		
		if (!instance) {
			const opts = config.poolOptions || { autostart: false };

			const factory = {
				create: async () => {
					const client = await esClient.EventStoreConnection.create(config, `tcp://${config.hostname}:${config.port}`);

					client.releaseConnection = () => instance.pool.release(client);
					client.on('connected', () => debug('', `${client._connectionName} - Connection Connected`));
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
						} catch (ex) {}
					});

					await client.connect();
					return client;
				},
				destroy: (client) => client.close()
			};

			instance = {
				config,
				pool: genericPool.createPool(factory, opts)
			};
			_instances.push(instance);
		}

		return instance.pool.acquire();
	},
	closeAll,
	_instances
};