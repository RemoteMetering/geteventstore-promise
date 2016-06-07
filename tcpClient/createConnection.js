var Eventstore = require('event-store-client');

module.exports = function(config, reject) {
	var esConnection = new Eventstore.Connection(config);
	esConnection.connection._events.error = reject;
	return esConnection;
};