import subscribeToPersistentSubscriptionToStream from './subscribeToPersistentSubscriptionToStream';
import createPersistentSubscriptionToStream from './createPersistentSubscriptionToStream';
import subscribeToStreamFrom from './subscribeToStreamFrom';
import iterateAllStreamEvents from './iterateAllStreamEvents';
import getAllStreamEvents from './getAllStreamEvents';
import getStreamMetadata from './getStreamMetadata';
import checkStreamExists from './checkStreamExists';
import subscribeToStream from './subscribeToStream';
import connectionManager from './connectionManager';
import iterateEventsByType from './iterateEventsByType';
import getEventsByType from './getEventsByType';
import iterateAllEvents from './iterateAllEvents';
import readAllEvents from './readAllEvents';
import deleteStream from './deleteStream';
import writeEvents from './writeEvents';
import writeEvent from './writeEvent';
import iterateReadEvents from './iterateReadEvents';
import readEvents from './readEvents';
import iterateEvents from './iterateEvents';
import getEvents from './getEvents';
import iterateReadAll from './iterateReadAll';
import readAll from './readAll';

import projectionGetAllProjectionsInfo from './projections/getAllProjectionsInfo';
import projectionDisableAll from './projections/disableAll';
import projectionEnableAll from './projections/enableAll';
import projectionGetState from './projections/getState';
import projectionGetResult from './projections/getResult';
import projectionGetInfo from './projections/getInfo';
import projectionAssert from './projections/assert';
import projectionRemove from './projections/remove';
import projectionStart from './projections/start';
import projectionReset from './projections/reset';
import projectionStop from './projections/stop';

import persistentSubscriptionGetAllSubscriptionsInfo from './persistentSubscriptions/getAllSubscriptionsInfo';
import persistentSubscriptionGetStreamSubscriptionsInfo from './persistentSubscriptions/getStreamSubscriptionsInfo';
import persistentSubscriptionGetSubscriptionInfo from './persistentSubscriptions/getSubscriptionInfo';
import persistentSubscriptionAssert from './persistentSubscriptions/assert';
import persistentSubscriptionRemove from './persistentSubscriptions/remove';

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
		_config.protocol = _config.protocol || 'kurrentdb+discover';
		_config.host = _config.hostname;
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;

		if (_config.gossipSeeds && _config.gossipSeeds.length > 0) {
			_config.protocol = 'kurrentdb';
		}

		const _getAllProjectionsInfo = projectionGetAllProjectionsInfo(_config);
		const _startProjection = projectionStart(_config);
		const _stopProjection = projectionStop(_config);

		this.getStreamMetadata = getStreamMetadata(_config);
		this.checkStreamExists = checkStreamExists(_config);
		this.writeEvent = writeEvent(_config);
		this.writeEvents = writeEvents(_config);
		// Async iterators are the primitives, the buffering read methods below collect from them
		this.iterateAllStreamEvents = iterateAllStreamEvents(_config);
		this.iterateAllEventsForward = iterateReadAll(_config, 'forward');
		this.iterateAllEventsBackward = iterateReadAll(_config, 'backward');
		this.iterateAllEvents = iterateAllEvents(this.iterateAllEventsForward, this.iterateAllEventsBackward);
		this.iterateEventsForward = iterateReadEvents(_config, 'forward');
		this.iterateEventsBackward = iterateReadEvents(_config, 'backward');
		this.iterateEvents = iterateEvents(this.iterateEventsForward, this.iterateEventsBackward);
		this.iterateEventsByType = iterateEventsByType(this.iterateEvents);

		this.getAllStreamEvents = getAllStreamEvents(_config);
		this.readAllEventsForward = readAll(_config, 'forward');
		this.readAllEventsBackward = readAll(_config, 'backward');
		this.readAllEvents = readAllEvents(this.iterateAllEvents);
		this.readEventsForward = readEvents(_config, 'forward');
		this.readEventsBackward = readEvents(_config, 'backward');
		this.getEvents = getEvents(this.iterateEvents);
		this.getEventsByType = getEventsByType(this.iterateEventsByType);
		this.deleteStream = deleteStream(_config);
		this.subscribeToStream = subscribeToStream(_config, this.checkStreamExists);
		this.subscribeToStreamFrom = subscribeToStreamFrom(_config, this.checkStreamExists);
		this.createPersistentSubscriptionToStream = createPersistentSubscriptionToStream(_config);
		this.subscribeToPersistentSubscriptionToStream = subscribeToPersistentSubscriptionToStream(_config);
		this.projections = {
			start: _startProjection,
			stop: _stopProjection,
			reset: projectionReset(_config),
			remove: projectionRemove(_config),
			getAllProjectionsInfo: _getAllProjectionsInfo,
			getState: projectionGetState(_config),
			getResult: projectionGetResult(_config),
			getInfo: projectionGetInfo(_getAllProjectionsInfo),
			assert: projectionAssert(_config, _getAllProjectionsInfo),
			disableAll: projectionDisableAll(_getAllProjectionsInfo, _stopProjection),
			enableAll: projectionEnableAll(_getAllProjectionsInfo, _startProjection)
		};
		this.persistentSubscriptions = {
			assert: persistentSubscriptionAssert(_config),
			remove: persistentSubscriptionRemove(_config),
			getSubscriptionInfo: persistentSubscriptionGetSubscriptionInfo(_config),
			getAllSubscriptionsInfo: persistentSubscriptionGetAllSubscriptionsInfo(_config),
			getStreamSubscriptionsInfo: persistentSubscriptionGetStreamSubscriptionsInfo(_config)
		};
		this.close = connectionManager.close(_config);
		this.getPool = connectionManager.getPool(_config);
		this.closeAllPools = connectionManager.closeAllPools;
	}
}