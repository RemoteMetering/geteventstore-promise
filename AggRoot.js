var debug = require('debug')('rms:eventstore'),
	_ = require('underscore');

var AggRoot = function(when) {
	var eventhandlers = when;

	this.handle = function(events) {
		debug('', 'Handling Events: ' + JSON.stringify(events));
		var self = this;
		if (events.length > 0) {
			_.each(events, function(ev) {
				if (eventhandlers[ev.eventType] !== undefined) {
					eventhandlers[ev.eventType].call(self, ev);
					if (ev.eventNumber) {
						self._version = ev.eventNumber;
					}
				}
			});
		}
	};
};

module.exports = AggRoot;