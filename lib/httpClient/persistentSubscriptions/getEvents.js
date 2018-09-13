import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:getEventsPersistentSubscription');
const baseErr = 'Get persistent subscriptions events - ';

const createRequest = (config, name, streamName, count, embed) => {
	const request = {
		url: `${config.baseUrl}/subscriptions/${streamName}/${name}/${count}?embed=${embed}`,
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.eventstore.competingatom+json',
		}
	};
	return request;
};

const appendLinkFunctions = (resultObject, links) => {
	links.forEach(link => resultObject[link.relation] = () => axios.post(link.uri));
};

const buildResultObject = (response) => {
	const result = { entries: [] };

	appendLinkFunctions(result, response.links);

	result.entries = response.entries.map(entry => {
		if (entry.data) entry.data = JSON.parse(entry.data);

		const formattedEntry = { event: entry };
		appendLinkFunctions(formattedEntry, entry.links);
		return formattedEntry;
	});

	debug('', 'Result: %j', result);
	return result;
};

export default (config) => async (name, streamName, count, embed) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	count = count === undefined ? 1 : count;
	embed = embed || 'Body';

	const options = createRequest(config, name, streamName, count, embed);
	debug('', 'Options: %j', options);
	const response = await axios(options);
	debug('', 'Response: %j', response.data);
	return buildResultObject(response.data);
};