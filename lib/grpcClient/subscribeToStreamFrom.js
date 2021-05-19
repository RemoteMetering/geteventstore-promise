import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import client from 'node-eventstore-client';
import debugModule from 'debug';
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
	return new Promise(async (resolve, reject) => {
		assert(streamName, `${baseErr}Stream Name not provided`);
		if (!fromEventNumber) fromEventNumber = -1;

		let connection;
		const onEvent = (sub, ev) => {
			const mappedEvent = mapEvents([ev])[0];
			if (mappedEvent) onEventAppeared(sub, mappedEvent);
		};

		const onConnected = async () => {
			try {
				const subscription = await connection.subscribeToStreamFrom(streamName, fromEventNumber, settings.resolveLinkTos, onEvent, onLiveProcessingStarted, onDropped, new client.UserCredentials(config.credentials.username, config.credentials.password), settings.readBatchSize);
				subscription.close = async () => {
					subscription.stop();
					await connection.releaseConnection();
					await connectionManager.close(config)(subscription._connection._connectionName);
				};
				debug('', 'Subscription: %j', subscription);
				resolve(subscription);
			} catch (ex) {
				reject(ex);
			}
		};

		try {
			connection = await connectionManager.create(config, onConnected, true);
		} catch (ex) {
			reject(ex);
		}
	});
};