import debugModule from 'debug';
import assert from 'assert';
import axios from 'axios';

const debug = debugModule('geteventstore:assertPersistentSubscription');
const baseErr = 'Assert persistent subscriptions - ';

const createPersistentSubscriptionRequest = (config, name, streamName, options) => {
	return {
		url: `${config.baseUrl}/subscriptions/${streamName}/${name}`,
		method: 'PUT',
		data: options
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

export default (config) => async (name, streamName, options) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	const persistentSubscriptionOptions = createPersistentSubscriptionOptions(options);
	const createRequest = createPersistentSubscriptionRequest(config, name, streamName, persistentSubscriptionOptions);

	try {
		debug('', 'Options: %j', createRequest);
		const response = await axios(createRequest);
		debug('', 'Response: %j', response.data);
		return response.data;
	} catch (err) {
		if (err.response.status !== 409) throw err;

		const updateRequest = createPersistentSubscriptionRequest(config, name, streamName, persistentSubscriptionOptions);
		updateRequest.method = 'post';

		debug('', 'Update Options: %j', updateRequest);
		const response = await axios(updateRequest);
		debug('', 'Response: %j', response.data);
		return response.data;
	}
};