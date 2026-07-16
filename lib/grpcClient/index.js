import subscribeToPersistentSubscriptionToStream from './subscribeToPersistentSubscriptionToStream.js';
import createPersistentSubscriptionToStream from './createPersistentSubscriptionToStream.js';
import subscribeToStreamFrom from './subscribeToStreamFrom.js';
import iterateAllStreamEvents from './iterateAllStreamEvents.js';
import getStreamMetadata from './getStreamMetadata.js';
import checkStreamExists from './checkStreamExists.js';
import subscribeToStream from './subscribeToStream.js';
import connectionManager from './connectionManager.js';
import iterateEventsByType from '../utilities/iterateEventsByType.js';
import iterateAllEvents from './iterateAllEvents.js';
import deleteStream from './deleteStream.js';
import multiStreamWrite from './multiStreamWrite.js';
import multiStreamWriteCrossStreamConsistency from './multiStreamWriteCrossStreamConsistency.js';
import writeEvents from './writeEvents.js';
import writeEvent from './writeEvent.js';
import iterateReadEvents from './iterateReadEvents.js';
import readEvents from './readEvents.js';
import iterateEvents from '../utilities/iterateEvents.js';
import buffered from '../utilities/buffered.js';
import assertClusterClientConfig from '../utilities/assertClusterClientConfig.js';
import iterateReadAll from './iterateReadAll.js';

import projectionCommand from './projections/command.js';
import projectionQuery from './projections/query.js';
import projectionGetAllProjectionsInfo from './projections/getAllProjectionsInfo.js';
import projectionDisableAll from './projections/disableAll.js';
import projectionEnableAll from './projections/enableAll.js';
import projectionGetInfo from './projections/getInfo.js';
import projectionAssert from './projections/assert.js';
import projectionRemove from './projections/remove.js';

import persistentSubscriptionGetAllSubscriptionsInfo from './persistentSubscriptions/getAllSubscriptionsInfo.js';
import persistentSubscriptionGetStreamSubscriptionsInfo from './persistentSubscriptions/getStreamSubscriptionsInfo.js';
import persistentSubscriptionGetSubscriptionInfo from './persistentSubscriptions/getSubscriptionInfo.js';
import persistentSubscriptionAssert from './persistentSubscriptions/assert.js';
import persistentSubscriptionRemove from './persistentSubscriptions/remove.js';

import cloneDeep from 'lodash.clonedeep';

const baseErr = 'gRPC client - ';

export default class GRPCClient {
	constructor(config) {
		assertClusterClientConfig(config, baseErr);

		//Add additional internal configuration properties
		const _config = cloneDeep(config);
		_config.protocol = _config.protocol || 'kurrentdb+discover';
		_config.host = _config.hostname;
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;

		if (_config.gossipSeeds && _config.gossipSeeds.length > 0) {
			_config.protocol = 'kurrentdb';
		}

		const _getAllProjectionsInfo = projectionGetAllProjectionsInfo(_config);
		const _startProjection = projectionCommand(_config, 'enableProjection', 'Start');
		const _stopProjection = projectionCommand(_config, 'disableProjection', 'Stop');

		this.getStreamMetadata = getStreamMetadata(_config);
		this.checkStreamExists = checkStreamExists(_config);
		this.writeEvent = writeEvent(_config);
		this.writeEvents = writeEvents(_config);
		this.multiStreamWrite = multiStreamWrite(_config);
		this.multiStreamWriteCrossStreamConsistency = multiStreamWriteCrossStreamConsistency(_config);
		// Async iterators are the primitives, the buffering read methods below collect from them
		this.iterateAllStreamEvents = iterateAllStreamEvents(_config);
		this.iterateAllEventsForward = iterateReadAll(_config, 'forward');
		this.iterateAllEventsBackward = iterateReadAll(_config, 'backward');
		this.iterateAllEvents = iterateAllEvents(this.iterateAllEventsForward, this.iterateAllEventsBackward);
		this.iterateEventsForward = iterateReadEvents(_config, 'forward');
		this.iterateEventsBackward = iterateReadEvents(_config, 'backward');
		this.iterateEvents = iterateEvents(this.iterateEventsForward, this.iterateEventsBackward);
		this.iterateEventsByType = iterateEventsByType(this.iterateEvents);

		this.getAllStreamEvents = buffered(this.iterateAllStreamEvents);
		this.readAllEventsForward = readEvents(this.iterateAllEventsForward);
		this.readAllEventsBackward = readEvents(this.iterateAllEventsBackward);
		this.readAllEvents = buffered(this.iterateAllEvents);
		this.readEventsForward = readEvents(this.iterateEventsForward);
		this.readEventsBackward = readEvents(this.iterateEventsBackward);
		this.getEvents = buffered(this.iterateEvents);
		this.getEventsByType = buffered(this.iterateEventsByType);
		this.deleteStream = deleteStream(_config);
		this.subscribeToStream = subscribeToStream(_config);
		this.subscribeToStreamFrom = subscribeToStreamFrom(_config);
		this.createPersistentSubscriptionToStream = createPersistentSubscriptionToStream(_config);
		this.subscribeToPersistentSubscriptionToStream = subscribeToPersistentSubscriptionToStream(_config);
		this.projections = {
			start: _startProjection,
			stop: _stopProjection,
			reset: projectionCommand(_config, 'resetProjection', 'Reset'),
			remove: projectionRemove(_config),
			getAllProjectionsInfo: _getAllProjectionsInfo,
			getState: projectionQuery(_config, 'getProjectionState', 'State'),
			getResult: projectionQuery(_config, 'getProjectionResult', 'Result'),
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
		this.getConnection = connectionManager.getConnection(_config);
		this.closeAllConnections = connectionManager.closeAllConnections;
	}
}