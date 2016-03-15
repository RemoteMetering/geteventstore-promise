var assert = require('assert');
var baseErr = 'geteventstore-promise - HTTP client - ';

module.exports = function(config) {
	//Assert configuration
	assert(config, baseErr + 'config not provided');
	assert(config.hostname, baseErr + 'hostname property not provided');
	assert(config.port, baseErr + 'port property not provided');
	assert(config.credentials, baseErr + 'credentials property not provided');
	assert(config.credentials.username, baseErr + 'credentials.username property not provided');
	assert(config.credentials.password, baseErr + 'credentials.password property not provided');

	//Add additional internal configuration properties
	config = JSON.parse(JSON.stringify(config));
	config.protocol = 'http';
	config.auth = config.credentials.username + ':' + config.credentials.password;

	return {
		checkStreamExists: require('./checkStreamExists')(config),
		writeEvent: require('./writeEvent')(config),
		writeEvents: require('./writeEvents')(config),
		getEvents: require('./getEvents')(config),
		admin: {
			scavenge: require('./admin/sendScavengeCommand')(config),
			shutdown: require('./admin/sendShutdownCommand')(config)
		},
		projections: {
			start: require('./projections/start')(config),
			stop: require('./projections/stop')(config),
			reset: require('./projections/reset')(config),
			assert: require('./projections/assert')(config),
			remove: require('./projections/remove')(config),
			getState: require('./projections/getState')(config),
			getInfo: require('./projections/getInfo')(config),
			getAllProjectionsInfo: require('./projections/getAllProjectionsInfo')(config),
			disableAll: require('./projections/disableAll')(config),
			enableAll: require('./projections/enableAll')(config)
		}
	}
}