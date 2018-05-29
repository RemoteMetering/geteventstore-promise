import _ from 'lodash';

export default (events) => _.map(events, ev => {
	ev.created = ev.updated;
	return ev;
});