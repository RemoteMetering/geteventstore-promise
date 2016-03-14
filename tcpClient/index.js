module.exports = function(config) {
	if (config) {
		config = JSON.parse(JSON.stringify(config));
		config.protocol = 'tcp';
		config.auth = config.credentials.username + ':' + config.credentials.password;
	}

	return {
		writeEvent: require('./writeEvent')(config),
		writeEvents: require('./writeEvents')(config),
		getAllStreamEvents: require('./getAllStreamEvents')(config),
		getEvents: require('./getEvents')(config),
		getEventsByType: require('./getEventsByType')(config),
		eventEnumerator: require('./eventEnumerator')(config)
	};
};