module.exports = function(config) {
	return {
		writeEvent: require('./writeEvent')(config),
		writeEvents: require('./writeEvents')(config),
		getEvents: require('./getEvents')(config),
		getProjectionState: require('./getProjectionState')(config),
		sendScavengeCommand: require('./sendScavengeCommand')(config),
		getAllProjectionInfo: require('./getAllProjectionInfo')(config)
	}
}