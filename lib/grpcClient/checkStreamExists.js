import connectionManager from './connectionManager';
import assert from 'assert';

const baseErr = 'Check stream exits - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const connection = await connectionManager.create(config);
	try {
		for await (const event of connection.readStream(streamName, { direction: 'forwards', maxCount: 1, fromRevision: 'start' }));
		return true;
	} catch (err) {
		if (err && err.type === 'stream-not-found') return false;
		throw err;
	} finally {
		connection.releaseConnection();
	}
};