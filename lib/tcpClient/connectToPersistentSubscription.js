import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';
import client from 'node-eventstore-client';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('geteventstore:connectToPersistentSubscription');
const baseErr = 'Connect to Persistent Subscription - ';

export default (config) => (
	streamName,
	groupName,
	onEventAppeared,
	onDropped,
) => new Promise(async (resolve, reject) => {
	assert(streamName, `${baseErr}Stream Name not provided`);
	assert(groupName, `${baseErr}Group Name not provided`);

	let connection;
	const onEvent = (sub, ev) => {
		const mappedEvent = mapEvents([ev])[0];
		if (mappedEvent) onEventAppeared(sub, mappedEvent);
	};

	const onConnected = async () => {
		try {
			const subscription = await connection.connectToPersistentSubscription(
				streamName, groupName, onEvent, onDropped, new client.UserCredentials(config.credentials.username, config.credentials.password), 10, true
			);

			debug('', 'Persistent Subscription: %j', subscription);
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
