const Eventstore = require('event-store-client');

module.exports = (config, reject) => {
	const esConnection = new Eventstore.Connection(config);
	esConnection.connection._events.error = reject;
	return esConnection;
};