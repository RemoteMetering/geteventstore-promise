export default (events) => events.map(ev => {
	ev.created = ev.updated;
	return ev;
});