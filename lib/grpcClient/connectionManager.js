import { KurrentDBClient } from '@kurrent/kurrentdb-client';

// The KurrentDB gRPC client multiplexes concurrent calls and subscriptions over
// a single HTTP/2 channel, so one shared client per config replaces connection
// pooling. The map stores the client promise so parallel first calls share one client.
const _connections = new Map();

const createClient = async (config) => {
	const connectionName = (config.connectionNameGenerator && await config.connectionNameGenerator()) || config.connectionName;
	const seedsString = config.gossipSeeds
		? `${config.auth}@${config.gossipSeeds.map(seed => `${seed.hostname}:${seed.port}`).join(',')}`
		: `${config.auth}@${config.host}:${config.port}`;
	return KurrentDBClient.connectionString(`${config.protocol}://${seedsString}?tls=${config.useSslConnection}${config.tlsCAFile ? `&tlsCAFile=${config.tlsCAFile}` : ''}${connectionName ? `&connectionName=${connectionName}` : ''}`);
};

export default {
	create(config) {
		let clientPromise = _connections.get(config);
		if (!clientPromise) {
			clientPromise = createClient(config);
			_connections.set(config, clientPromise);
		}
		return clientPromise;
	},
	close(config) {
		return async () => {
			const clientPromise = _connections.get(config);
			if (!clientPromise) return;
			_connections.delete(config);
			const client = await clientPromise;
			await client.dispose();
		};
	},
	getConnection(config) {
		return async () => {
			const clientPromise = _connections.get(config);
			if (!clientPromise) throw new Error(`Connection not found`);
			return clientPromise;
		};
	},
	async closeAllConnections() {
		const clients = await Promise.all([..._connections.values()]);
		_connections.clear();
		await Promise.all(clients.map(client => client.dispose()));
	}
};
