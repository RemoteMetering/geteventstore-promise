module.exports = function(config) {
	return {
		checkStreamExists: require('./checkStreamExists')(config),
		writeEvent: require('./writeEvent')(config),
		writeEvents: require('./writeEvents')(config),
		getEvents: require('./getEvents')(config),
		getProjectionState: require('./getProjectionState')(config),
		getAllProjectionInfo: require('./getAllProjectionInfo')(config)
		sendScavengeCommand: require('./sendScavengeCommand')(config),
	}
}