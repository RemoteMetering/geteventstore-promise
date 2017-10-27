import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';
import _ from 'lodash';

const debug = debugModule('geteventstore:getEventsPersistentSubscription');
const baseErr = 'Get persistent subscriptions events - ';

const createRequest = (config, name, streamName, count, embed) => {
	const request = {
		uri: `${config.baseUrl}/subscriptions/${streamName}/${name}/${count}?embed=${embed}`,
		method: 'GET',
		json: true,
		headers: {
			'Accept': 'application/vnd.eventstore.competingatom+json',
		}
	};
	return request;
};

const postUrl = (uri) => () => {
	const postRequest = {
		uri,
		method: 'POST',
		json: true,
		headers: {
			'Content-Type': 'application/json',
		}
	};
	return req(postRequest);
};

const appendLinkFunctions = (resultObject, links) => {
	_.each(links, link => resultObject[link.relation] = postUrl(link.uri));
};

const buildResultObject = (response) => {
	debug('', 'Response: %j', response);
	const result = {
		entries: []
	};

	appendLinkFunctions(result, response.links);

	result.entries = _.map(response.entries, entry => {
		if (entry.data) entry.data = JSON.parse(entry.data);

		const formattedEntry = {
			event: entry
		};
		appendLinkFunctions(formattedEntry, entry.links);
		return formattedEntry;
	});

	debug('', 'Result: %j', result);
	return result;
};

export default (config) => async(name, streamName, count, embed) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	count = count === undefined ? 1 : count;
	embed = embed || 'Body';

	const options = createRequest(config, name, streamName, count, embed);
	debug('', 'Options: %j', options);
	return req(options).then(buildResultObject);
};