import assert from 'assert';
import url from 'url';

const baseErr = 'geteventstore-promise - TCP client - ';

export default (config) => {
	//Assert configuration
	assert(config, `${baseErr}config not provided`);
	assert(config.hostname, `${baseErr}hostname property not provided`);
	assert(config.port, `${baseErr}port property not provided`);
	assert(config.credentials, `${baseErr}credentials property not provided`);
	assert(config.credentials.username, `${baseErr}credentials.username property not provided`);
	assert(config.credentials.password, `${baseErr}credentials.password property not provided`);

	//Add additional internal configuration properties
	config = JSON.parse(JSON.stringify(config));
	config.protocol = 'tcp';
	config.host = config.hostname;
	config.auth = `${config.credentials.username}:${config.credentials.password}`;
	config.baseUrl = url.format(config);

	return {
		checkStreamExists: require('./checkStreamExists')(config),
		writeEvent: require('./writeEvent')(config),
		writeEvents: require('./writeEvents')(config),
		getAllStreamEvents: require('./getAllStreamEvents')(config),
		getEvents: require('./getEvents')(config),
		getEventsByType: require('./getEventsByType')(config),
		deleteStream: require('./deleteStream')(config),
		eventEnumerator: require('./eventEnumerator')(config),
		subscribeToStream: require('./subscribeToStream')(config),
		subscribeToStreamFrom: require('./subscribeToStreamFrom')(config),
		close: require('./connectionManager').close(config),
		getPool: require('./connectionManager').getPool(config),
		closeAllPools: require('./connectionManager').closeAllPools
	};
};