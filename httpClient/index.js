module.exports = function(config) {
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