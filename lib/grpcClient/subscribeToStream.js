import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config) => (
	streamName,
	onEventAppeared,
	onDropped,
	resolveLinkTos = false
) => new Promise(async (resolve, reject) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	let connection;
	const onEvent = (sub, ev) => {
		const mappedEvent = mapEvents([ev])[0];
		if (mappedEvent) onEventAppeared(sub, mappedEvent);
	};

	const onConnected = async () => {
		try {
			const subscription = await connection.subscribeToStream(streamName, resolveLinkTos, onEvent, onDropped, new client.UserCredentials(config.credentials.username, config.credentials.password));

			const originalClose = subscription.close;
			subscription.close = async function releaseSubConnectionFromPool() {
				await originalClose.call(subscription);
				await connection.releaseConnection();
				await (connectionManager.close(config))(connection._connectionName);
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