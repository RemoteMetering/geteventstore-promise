/* global fromAll */
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
  })
  .transformBy((state) => {
    state.data = 321;
    return state;
  });
