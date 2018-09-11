import esClient from 'node-eventstore-client';
import assert from 'assert';
import url from 'url';

const baseErr = 'geteventstore-promise - TCP client - ';

export default (config) => {
	//Assert configuration
	assert(config, `${baseErr}config not provided`);
	if (config.gossipSeeds) {
		assert(Array.isArray(config.gossipSeeds), `${baseErr}gossipSeeds must be an array`);
		assert(config.gossipSeeds.length >= 3, `${baseErr}at least 3 gossipSeeds are required`);

		config.gossipSeeds.forEach(seed => {
			assert(seed.hostname, `${baseErr}gossip seed must have a hostname`);
			assert(seed.port, `${baseErr}gossip seed must have a port`);
		});
	} else {
		assert(config.hostname, `${baseErr}hostname property not provided`);
		assert(config.port, `${baseErr}port property not provided`);
	}
	assert(config.credentials, `${baseErr}credentials property not provided`);
	assert(config.credentials.username, `${baseErr}credentials.username property not provided`);
	assert(config.credentials.password, `${baseErr}credentials.password property not provided`);

	//Add additional internal configuration properties
	config = JSON.parse(JSON.stringify(config));
	config.protocol = config.protocol || 'tcp';
	config.host = config.hostname;
	config.auth = `${config.credentials.username}:${config.credentials.password}`;
	config.baseUrl = url.format(config);

	if (config.gossipSeeds && config.gossipSeeds.length > 0) {
		config.gossipSeeds = config.gossipSeeds.map(seed => new esClient.GossipSeed({ host: seed.hostname, port: seed.port }, seed.hostHeader));
	}

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