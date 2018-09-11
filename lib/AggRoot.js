import debugModule from 'debug';

const debug = debugModule('geteventstore:aggRoot');

const AggRoot = function(when) {
	const eventHandlers = when;

	this.handle = function(events) {
		debug('', 'Handling Events: %j', events);
		const self = this;
		if (events.length > 0) {
			for (let i = 0; i < events.length; i++) {
				const ev = events[i];
				if (eventHandlers[ev.eventType] !== undefined) {
					eventHandlers[ev.eventType].call(self, ev);
					if (ev.eventNumber !== undefined) {
						self._version = ev.eventNumber;
					}
				}
			}
		}
	};
};

export default AggRoot;