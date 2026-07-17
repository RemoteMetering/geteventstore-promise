import esClient from 'node-eventstore-client';
import cloneDeep from 'lodash.clonedeep';
import url from 'url';
import subscribeToStreamFrom from './subscribeToStreamFrom.js';
import iterateAllStreamEvents from './iterateAllStreamEvents.js';
import iterateEventsByType from '../utilities/iterateEventsByType.js';
import iterateReadEvents from './iterateReadEvents.js';
import iterateEvents from '../utilities/iterateEvents.js';
import buffered from '../utilities/buffered.js';
import assertClusterClientConfig from '../utilities/assertClusterClientConfig.js';
import checkStreamExists from './checkStreamExists.js';
import subscribeToStream from './subscribeToStream.js';
import connectionManager from './connectionManager.js';
import setStreamMetadata from './setStreamMetadata.js';
import eventEnumerator from './eventEnumerator.js';
import deleteStream from './deleteStream.js';
import writeEvents from './writeEvents.js';
import writeEvent from './writeEvent.js';
import readEvents from './readEvents.js';

const baseErr = 'TCP client - ';

export default class TCPClient {
  constructor(config) {
    assertClusterClientConfig(config, baseErr);

    // Add additional internal configuration properties
    const _config = cloneDeep(config);
    _config.protocol = _config.protocol || 'tcp';
    _config.host = _config.hostname;
    _config.auth = `${_config.credentials.username}:${_config.credentials.password}`;
    _config.baseUrl = url.format(_config);
    _config.includeDeleted = _config.includeDeleted !== false;

    if (_config.useSslConnection)
      _config.validateServer =
        _config.validateServer === undefined || _config.validateServer === null ? true : _config.validateServer;
    if (_config.gossipSeeds && _config.gossipSeeds.length > 0) {
      _config.gossipSeeds = _config.gossipSeeds.map(
        (seed) => new esClient.GossipSeed({ host: seed.hostname, port: seed.port }, seed.hostHeader)
      );
    }

    this.checkStreamExists = checkStreamExists(_config);
    this.setStreamMetadata = setStreamMetadata(_config);
    this.writeEvent = writeEvent(_config);
    this.writeEvents = writeEvents(_config);
    // Async iterators are the primitives, the buffering get* methods below collect from them
    this.iterateAllStreamEvents = iterateAllStreamEvents(_config);
    this.iterateEventsForward = iterateReadEvents(_config, 'forward');
    this.iterateEventsBackward = iterateReadEvents(_config, 'backward');
    this.iterateEvents = iterateEvents(this.iterateEventsForward, this.iterateEventsBackward);
    this.iterateEventsByType = iterateEventsByType(this.iterateEvents);

    this.getAllStreamEvents = buffered(this.iterateAllStreamEvents);
    this.readEventsForward = readEvents(_config, 'forward');
    this.readEventsBackward = readEvents(_config, 'backward');
    this.getEvents = buffered(this.iterateEvents);
    this.getEventsByType = buffered(this.iterateEventsByType);
    this.deleteStream = deleteStream(_config);
    this.eventEnumerator = eventEnumerator(_config);
    this.subscribeToStream = subscribeToStream(_config);
    this.subscribeToStreamFrom = subscribeToStreamFrom(_config);
    this.close = connectionManager.close(_config);
    this.getPool = connectionManager.getPool(_config);
    this.closeAllPools = connectionManager.closeAllPools;
  }
}
