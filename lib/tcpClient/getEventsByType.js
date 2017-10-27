import assert from 'assert';
import _ from 'lodash';

const baseErr = 'Get Events by Type - ';

export default (config) => async(streamName, eventTypes, startPosition, length, direction, resolveLinkTos) => {
	assert(eventTypes, `${baseErr}Event Types not provided`);

	const getEvents = require('./getEvents')(config);
	const events = await getEvents(streamName, startPosition, length, direction, resolveLinkTos);
	return _.filter(events, event => _.includes(eventTypes, event.eventType));
};