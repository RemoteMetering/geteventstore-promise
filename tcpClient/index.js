module.exports = function(config) {
	return {
		writeEvent: require('./writeEvent')(config),
		writeEvents: require('./writeEvents')(config),
		getAllStreamEvents: require('./getAllStreamEvents')(config),
		getEvents: require('./getEvents')(config),
		getEventsByType: require('./getEventsByType')(config),
		eventEnumerator: require('./eventEnumerator')(config)
	};
};