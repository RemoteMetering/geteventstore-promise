import debugModule from 'debug';
import assert from 'assert';

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

const appendLinkFunctions = (config, httpClient, resultObject, links) => {
	links.forEach(
		(link) =>
		(resultObject[link.relation] = () =>
			httpClient.post(
				link.uri, {}, {
					auth: {
						username: config.credentials.username,
						password: config.credentials.password,
					},
				}
			)
		)
	);
};

const buildResultObject = (config, httpClient, response) => {
	const result = { entries: [] };

	appendLinkFunctions(config, httpClient, result, response.links);

	result.entries = response.entries.map(entry => {
		if (entry.data) entry.data = JSON.parse(entry.data);

		const formattedEntry = { event: entry };
		appendLinkFunctions(config, httpClient, formattedEntry, entry.links);
		return formattedEntry;
	});

	debug('', 'Result: %j', result);
	return result;
};

export default (config, httpClient) => async (name, streamName, count, embed) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	count = count === undefined ? 1 : count;
	embed = embed || 'Body';

	const options = createRequest(config, name, streamName, count, embed);
	debug('', 'Options: %j', options);
	const response = await httpClient(options);
	debug('', 'Response: %j', response.data);
	return buildResultObject(config, httpClient, response.data);
};