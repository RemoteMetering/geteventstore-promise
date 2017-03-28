var debug = require('debug')('geteventstore:aggRoot'),
	_ = require('lodash');

var AggRoot = function(when) {
	var eventhandlers = when;

	this.handle = function(events) {
		debug('', 'Handling Events: %j', events);
		var self = this;
		if (events.length > 0) {
			_.each(events, ev => {
				if (eventhandlers[ev.eventType] !== undefined) {
					eventhandlers[ev.eventType].call(self, ev);
					if (ev.eventNumber !== undefined) {
						self._version = ev.eventNumber;
					}
				}
			});
		}
	};
};

module.exports = AggRoot;