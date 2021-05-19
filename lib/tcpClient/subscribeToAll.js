import assert from 'assert';

import debugModule from 'debug';
import client from 'node-eventstore-client';

import connectionManager from './connectionManager';
import mapEvents from './utilities/mapEvents';

const debug = debugModule('geteventstore:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config) => (
	onEventAppeared,
	onDropped,
	resolveLinkTos = false
) => new Promise(async (resolve, reject) => {
	let connection;
	const onEvent = (sub, ev) => {
		const mappedEvent = mapEvents([ev])[0];
		if (mappedEvent) onEventAppeared(sub, mappedEvent);
	};

	const onConnected = async () => {
		try {
			const subscription = await connection.subscribeToAll(resolveLinkTos, onEvent, onDropped, new client.UserCredentials(config.credentials.username, config.credentials.password));
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