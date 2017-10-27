import createConnection from './createConnection';
import debugModule from 'debug';
import Promise from 'bluebird';
import assert from 'assert';

const debug = debugModule('geteventstore:subscribeToStream');
const baseErr = 'Subscribe to Stream - ';

export default (config) => (streamName, onEventAppeared, onConfirmed, onDropped, resolveLinkTos) => new Promise((resolve, reject) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	resolveLinkTos = resolveLinkTos || false;

	const connection = createConnection(config, reject);
	const subscription = connection.subscribeToStream(streamName, resolveLinkTos, onEventAppeared, onConfirmed, onDropped, config.credentials);
	debug('', 'Subscription: %j', subscription);
	resolve(connection);
});