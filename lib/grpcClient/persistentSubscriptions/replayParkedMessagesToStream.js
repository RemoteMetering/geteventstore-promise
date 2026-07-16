import connectionManager from '../connectionManager.js';
import debugModule from 'debug';
import assert from 'assert';

const debug = debugModule('metronomic-kurrentdb-client:replayParkedMessagesToStream');
const baseErr = 'Replay parked messages to stream - ';

export default (config) => async (name, streamName, options) => {
	assert(name, `${baseErr}Persistent Subscription Name not provided`);
	assert(streamName, `${baseErr}Stream Name not provided`);

	debug('', 'Replay parked messages: %s/%s', streamName, name);
	const connection = await connectionManager.getOrCreate(config);
	return connection.replayParkedMessagesToStream(streamName, name, options);
};
