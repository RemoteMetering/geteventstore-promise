import connectionManager from '../connectionManager.js';

// Acquires a pooled connection, runs the operation, and always releases the
// connection back to the pool.
export default async (config, operation, isSubscription = false) => {
	const connection = await connectionManager.create(config, isSubscription);
	try {
		return await operation(connection);
	} finally {
		connection.releaseConnection();
	}
};
