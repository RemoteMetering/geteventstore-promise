import assert from 'assert';
import url from 'url';

import esClient from 'node-eventstore-client';

import checkStreamExists from './checkStreamExists';
import connectionManager from './connectionManager';
import deleteStream from './deleteStream';
import eventEnumerator from './eventEnumerator';
import getAllStreamEvents from './getAllStreamEvents';
import getEvents from './getEvents';
import getEventsByType from './getEventsByType';
import readEvents from './readEvents';
import subscribeToAll from './subscribeToAll';
import subscribeToStream from './subscribeToStream';
import subscribeToStreamFrom from './subscribeToStreamFrom';
import writeEvent from './writeEvent';
import writeEvents from './writeEvents';

const baseErr = 'geteventstore-promise - TCP client - ';

export default class TCPClient {
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

		//Add additional internal configuration properties
		const _config = JSON.parse(JSON.stringify(config));
		_config.protocol = _config.protocol || 'tcp';
		_config.host = _config.hostname;
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;
		_config.baseUrl = url.format(_config);

		if (_config.gossipSeeds && _config.gossipSeeds.length > 0) {
			_config.gossipSeeds = _config.gossipSeeds.map(seed => new esClient.GossipSeed({
				host: seed.hostname,
				port: seed.port
			}, seed.hostHeader));
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
		this.eventEnumerator = eventEnumerator(_config);
		this.subscribeToStream = subscribeToStream(_config);
		this.subscribeToAll = subscribeToAll(_config);
		this.subscribeToStreamFrom = subscribeToStreamFrom(_config);
		this.close = connectionManager.close(_config);
		this.getPool = connectionManager.getPool(_config);
		this.closeAllPools = connectionManager.closeAllPools;
	}
}