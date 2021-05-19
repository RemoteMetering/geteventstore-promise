import connectionManager from './connectionManager';
import esClient from 'node-eventstore-client';
import assert from 'assert';

const baseErr = 'Check stream exits - ';

export default (config) => async (streamName) => {
	assert(streamName, `${baseErr}Stream Name not provided`);

	const connection = await connectionManager.create(config);
	try {
		const slice = await connection.readStreamEventsForward(streamName, 0, 1, true, config.credentials);
		if (slice.status === esClient.sliceReadStatus.StreamDeleted) throw new Error(`Stream hard deleted`);
		if (slice.status === esClient.sliceReadStatus.StreamNotFound) return false;
		return true;
	} catch (err) {
		throw err;
	} finally {
		connection.releaseConnection();
	}
};