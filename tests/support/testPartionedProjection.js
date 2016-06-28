fromAll()
	.foreachStream()
	.when({
		$init: function() {
			return {
				data: {}
			};
		},
		TestProjectionEventType: function(state, ev) {
			state.data = ev.data;
		}
	});