fromAll()
	.when({
		$init() {
			return {
				data: {}
			};
		},
		TestProjectionEventType(state, ev) {
			state.data = ev.data;
		}
	}).transformBy(function(state) {
		state.data = 321;
		return state;
	});
