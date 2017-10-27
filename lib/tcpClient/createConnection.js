import Eventstore from 'event-store-client';

export default (config, reject) => {
	const esConnection = new Eventstore.Connection(config);
	esConnection.connection._events.error = reject;
	return esConnection;
};