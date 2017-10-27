import req from 'request-promise';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:assertPersistentSubscription');
const baseErr = 'Assert persistent subscriptions - ';

const createPersistentSubscriptionRequest = (config, name, streamName, options) => {
	return {
		uri: `${config.baseUrl}/subscriptions/${streamName}/${name}`,
		method: 'PUT',
		json: true,
		headers: {
			'Content-Type': 'application/json',
		},
		body: options
	};
};

const createPersistentSubscriptionOptions = (options) => {
	options = options || {};

	return {
		resolveLinktos: options.resolveLinktos,
		startFrom: options.startFrom === undefined ? 0 : options.startFrom,
		extraStatistics: options.extraStatistics,
		checkPointAfterMilliseconds: options.checkPointAfterMilliseconds,
		liveBufferSize: options.liveBufferSize,
		readBatchSize: options.readBatchSize,
		bufferSize: options.bufferSize,
		maxCheckPointCount: options.maxCheckPointCount,
		maxRetryCount: options.maxRetryCount,
		maxSubscriberCount: options.maxSubscriberCount,
		messageTimeoutMilliseconds: options.messageTimeoutMilliseconds,
		minCheckPointCount: options.minCheckPointCount,
		namedConsumerStrategy: options.namedConsumerStrategy,
	};
};

export default (config) => async(name, streamName, options) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	const persistentSubscriptionOptions = createPersistentSubscriptionOptions(options);
	const createRequest = createPersistentSubscriptionRequest(config, name, streamName, persistentSubscriptionOptions);

	try {
		debug('', 'Options: %j', createRequest);
		const response = await req(createRequest);
		debug('', 'Response: %j', response);
		return response;
	} catch (err) {
		if (err.statusCode !== 409) throw err;

		const updateRequest = createPersistentSubscriptionRequest(config, name, streamName, persistentSubscriptionOptions);
		updateRequest.method = 'POST';

		debug('', 'Update Options: %j', updateRequest);
		const response = await req(updateRequest);
		debug('', 'Response: %j', response);
		return response;
	}
};