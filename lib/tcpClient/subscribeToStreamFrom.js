import createConnection from './createConnection';
import EventStoreClient from 'event-store-client';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';

const debug = debugModule('geteventstore:subscribeToStreamFrom');
const baseErr = 'Subscribe to Stream From - ';

export default (config) => (
	streamName,
	fromEventNumber,
	onEventAppeared,
	onLiveProcessingStarted,
	onDropped,
	settings
) => {
	settings = settings || {};
	return new Promise((resolve, reject) => {
		assert(streamName, `${baseErr}Stream Name not provided`);
		if (fromEventNumber === 0) fromEventNumber = undefined;

		const catchUpSettings = new EventStoreClient.CatchUpSubscription.Settings();

		if (settings.resolveLinkTos) catchUpSettings.resolveLinkTos = settings.resolveLinkTos;
		if (settings.maxLiveQueueSize) catchUpSettings.maxLiveQueueSize = settings.maxLiveQueueSize;
		if (settings.readBatchSize) catchUpSettings.readBatchSize = settings.readBatchSize;
		if (settings.debug) catchUpSettings.debug = settings.debug;

		const connection = createConnection(config, reject);
		const subscription = connection.subscribeToStreamFrom(streamName, fromEventNumber, config.credentials, onEventAppeared, onLiveProcessingStarted, onDropped, catchUpSettings);
		debug('', 'Subscription: %j', subscription);
		resolve(connection);
	});
};