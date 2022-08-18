import subscribeToStreamFrom from './subscribeToStreamFrom';
import getAllStreamEvents from './getAllStreamEvents';
import checkStreamExists from './checkStreamExists';
import subscribeToStream from './subscribeToStream';
import connectionManager from './connectionManager';
import getEventsByType from './getEventsByType';
import deleteStream from './deleteStream';
import writeEvents from './writeEvents';
import writeEvent from './writeEvent';
import readEvents from './readEvents';
import getEvents from './getEvents';

import cloneDeep from 'lodash.clonedeep';
import assert from 'assert';

const baseErr = 'geteventstore-promise - gRPC client - ';

export default class GRPCClient {
	constructor(config) {
		assert(config, `${baseErr}config not provided`);
		if (config.gossipSeeds) {
			assert(Array.isArray(config.gossipSeeds), `${baseErr}gossipSeeds must be an array`);
			assert(config.gossipSeeds.length >= 3, `${baseErr}at least 3 gossipSeeds are required`);

			config.gossipSeeds.forEach(seed => {
				assert(seed.hostname, `${baseErr}gossip seed must have a hostname`);
				assert(seed.port, `${baseErr}gossip seed must have a port`);
			});
		} else {
			assert(config.hostname, `${baseErr}hostname property not provided`);
			assert(config.port, `${baseErr}port property not provided`);
		}
		assert(config.credentials, `${baseErr}credentials property not provided`);
		assert(config.credentials.username, `${baseErr}credentials.username property not provided`);
		assert(config.credentials.password, `${baseErr}credentials.password property not provided`);
		if (config.connectionNameGenerator) assert(typeof config.connectionNameGenerator === 'function', `${baseErr}connectionNameGenerator must be a function`);

		//Add additional internal configuration properties
		const _config = cloneDeep(config);
		_config.protocol = _config.protocol || 'esdb+discover';
		_config.host = _config.hostname;
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;

		if (_config.gossipSeeds && _config.gossipSeeds.length > 0) {
			_config.protocol = 'esdb';
		}

		this.checkStreamExists = checkStreamExists(_config);
		this.writeEvent = writeEvent(_config);
		this.writeEvents = writeEvents(_config);
		this.getAllStreamEvents = getAllStreamEvents(_config);
		this.readEventsForward = readEvents(_config, 'forward');
		this.readEventsBackward = readEvents(_config, 'backward');
		this.getEvents = getEvents(this.readEventsForward, this.readEventsBackward);
		this.getEventsByType = getEventsByType(this.getEvents);
		this.deleteStream = deleteStream(_config);
		this.subscribeToStream = subscribeToStream(_config, this.checkStreamExists);
		this.subscribeToStreamFrom = subscribeToStreamFrom(_config, this.checkStreamExists);
		this.close = connectionManager.close(_config);
		this.getPool = connectionManager.getPool(_config);
		this.closeAllPools = connectionManager.closeAllPools;
	}
}