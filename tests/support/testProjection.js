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
	});