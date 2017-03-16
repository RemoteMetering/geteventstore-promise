var _ = require('lodash');

module.exports = function(events) {
	return _.map(events, function(ev) {
		let event = ev.event;
		return {
			data: JSON.parse(event.data.toString()),
			eventStreamId: event.eventStreamId,
			eventNumber: event.eventNumber,
		};
	});
};