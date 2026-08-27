import {
  EventStoreSubscription,
  WriteResult as TCPWriteResult,
  DeleteResult as TCPDeleteResult,
  LiveProcessingStartedCallback,
  SubscriptionDroppedCallback,
  ConnectionSettings
} from 'node-eventstore-client';

import {
  AppendResult as GRPCAppendResult,
  MultiAppendResult as GRPCMultiAppendResult,
  DeleteResult as GRPCDeleteResult,
  StreamSubscription,
  AllStreamSubscription,
  PersistentSubscriptionToStream,
  PersistentSubscriptionToAll,
  Filter,
  ProjectionDetails,
  GetStreamMetadataResult,
  StreamMetadata,
  SetStreamMetadataOptions,
  ReadPosition,
  KurrentDBClient
} from '@kurrent/kurrentdb-client';

import { Options as ConnectionPoolOptions, Pool as ConnectionPool } from 'generic-pool';

export interface NewEvent {
  eventId: string;
  eventType: string;
  data: object;
  metadata?: object;
}

export interface Event {
  streamId: string;
  eventId: string;
  eventNumber: number;
  eventType: string;
  created: string;
  data: object | null;
  metadata?: object | null;
  isJson?: boolean;
  isResolved?: boolean;
  positionStreamId?: string;
  positionEventId?: string;
  positionEventNumber?: number;
  positionCreated?: string;
  positionCausedBy?: string;
  positionCorrelationId?: string;
}

export type ProjectionMode = 'onetime' | 'continuous';

export type ReadDirection = 'forward' | 'backward';

export type EmbedType = 'body' | 'rich' | 'PrettyBody' | 'TryHarder';

export interface UserCredentials {
  readonly username: string;
  readonly password: string;
}

export interface GossipSeed {
  readonly hostname: string;
  readonly port: number;
}

export interface HTTPConfig {
  protocol?: string;
  hostname: string;
  port: number;
  timeout?: number;
  validateServer?: boolean;
  credentials: UserCredentials;
}

export interface TCPConfig extends ConnectionSettings {
  protocol?: string;
  hostname?: string;
  port?: number;
  useSslConnection?: boolean;
  validateServer?: boolean;
  gossipSeeds?: GossipSeed[];
  credentials: UserCredentials;
  poolOptions?: ConnectionPoolOptions;
  connectionNameGenerator?: () => string | Promise<string>;
  includeDeleted?: boolean;
}

export interface GRPCConfig {
  protocol?: string;
  hostname?: string;
  port?: number;
  useSslConnection?: boolean;
  tlsCAFile?: string;
  gossipSeeds?: GossipSeed[];
  credentials: UserCredentials;
  connectionName?: string;
  connectionNameGenerator?: () => string | Promise<string>;
  includeDeleted?: boolean;
  maxDiscoverAttempts?: number;
  gossipTimeout?: number;
  discoveryInterval?: number;
  keepAliveInterval?: number;
  keepAliveTimeout?: number;
  defaultDeadline?: number;
  nodePreference?: 'leader' | 'follower' | 'read_only_replica' | 'random';
  throwOnAppendFailure?: boolean;
  tlsVerifyCert?: boolean;
  userCertFile?: string;
  userKeyFile?: string;
}

export interface HTTPWriteEventOptions {
  expectedVersion?: number;
}

export interface TCPWriteEventOptions {
  expectedVersion?: number;
}

export interface StreamMetadataOptions {
  expectedVersion?: number;
}

export interface GRPCWriteEventOptions {
  expectedVersion?: number;
  batchAppendSizeInBytes?: number;
}

export interface GRPCMultiStreamWrite {
  streamName: string;
  // Event metadata must be a plain object of string keys to string values.
  // Non string values cause the underlying multiStreamAppend to reject the transaction.
  events: NewEvent[];
  expectedVersion?: number | 'any' | 'no_stream' | 'stream_exists';
}

export interface GRPCMultiStreamWriteRecord {
  streamName: string;
  // Event metadata must be a plain object of string keys to string values.
  // Non string values cause the underlying appendRecords to reject the transaction.
  event: NewEvent;
}

export interface GRPCConsistencyCheck {
  streamName: string;
  // A revision number, or one of "any", "no_stream", "stream_exists".
  // null, undefined and -2 are all treated as "any".
  expectedVersion?: number | 'any' | 'no_stream' | 'stream_exists';
}

export interface TCPWriteEventsOptions extends TCPWriteEventOptions {
  transactionWriteSize?: number;
}

// node-eventstore-client returns 64-bit event numbers as Long values. Declared structurally
// because 'long' is a transitive dependency and is not resolvable from this package.
export interface Long {
  low: number;
  high: number;
  unsigned: boolean;
  toNumber(): number;
  toString(radix?: number): string;
}

export interface TCPReadResult {
  status: string;
  stream: string;
  fromEventNumber: Long;
  readDirection: string;
  events: Event[];
  nextEventNumber: Long;
  lastEventNumber: Long;
  isEndOfStream: boolean;
}

export interface GRPCReadResult {
  events: Event[];
}

export interface GRPCStreamReadResult {
  events: Event[];
  isEndOfStream: boolean;
  readDirection: ReadDirection;
  fromEventNumber: number | string;
  nextEventNumber: number;
}

export interface HTTPReadResultAuthor {
  name: string;
}

export interface HTTPReadResultLink {
  uri: string;
  relation: string;
}

export interface HTTPReadResult {
  title: string;
  id: string;
  updated: string;
  streamId: string;
  author: HTTPReadResultAuthor;
  headOfStream: boolean;
  isEndOfStream: boolean;
  readDirection: ReadDirection;
  fromEventNumber: number;
  nextEventNumber: number;
  selfUrl: string;
  links: HTTPReadResultLink[];
  events: Event[];
}

export interface ProjectionStateOptions {
  partition?: string;
}

export interface HTTPPersistentSubscriptionOptions {
  resolveLinkTos?: boolean;
  startFrom?: number;
  extraStatistics?: boolean;
  messageTimeoutMilliseconds?: number;
  maxRetryCount?: number;
  liveBufferSize?: number;
  readBatchSize?: number;
  bufferSize?: number;
  checkPointAfterMilliseconds?: number;
  minCheckPointCount?: number;
  maxCheckPointCount?: number;
  maxSubscriberCount?: number;
  namedConsumerStrategy?: string;
}

export interface GRPCPersistentSubscriptionOptions {
  resolveLinkTos?: boolean;
  startFrom?: number | bigint | 'start' | 'end';
  startPosition?: number | bigint | 'start' | 'end';
  extraStatistics?: boolean;
  messageTimeout?: number;
  maxRetryCount?: number;
  liveBufferSize?: number;
  readBatchSize?: number;
  historyBufferSize?: number;
  checkPointAfter?: number;
  checkPointLowerBound?: number;
  checkPointUpperBound?: number;
  maxSubscriberCount?: number;
  consumerStrategyName?: string;
}

/**
 * @deprecated Mixed both clients' names, so six of its options were silently discarded whichever
 * client you used. Use HTTPPersistentSubscriptionOptions or GRPCPersistentSubscriptionOptions.
 */
export type PersistentSubscriptionOptions = HTTPPersistentSubscriptionOptions & GRPCPersistentSubscriptionOptions;

export type AllPosition = 'start' | 'end' | { commit: bigint; prepare: bigint };

// gRPC only, and already uses the SDK's setting names.
export interface PersistentSubscriptionToAllOptions {
  resolveLinkTos?: boolean;
  startFrom?: AllPosition;
  startPosition?: AllPosition;
  extraStatistics?: boolean;
  messageTimeout?: number;
  maxRetryCount?: number;
  liveBufferSize?: number;
  readBatchSize?: number;
  historyBufferSize?: number;
  checkPointAfter?: number;
  checkPointLowerBound?: number;
  checkPointUpperBound?: number;
  maxSubscriberCount?: number;
  consumerStrategyName?: string;
  // Only applied on create. Filters the $all stream by event type or stream prefix.
  filter?: Filter;
}

export interface ReplayParkedMessagesOptions {
  // When to stop replaying parked messages. Leave undefined for no limit.
  stopAt?: number | bigint;
}

export interface PersistentSubscriptionAssertResult {
  correlationId: string;
  reason: string;
  result: string;
  msgTypeId: number;
}

// Projection config as returned by the HTTP client. emitEnabled and
// trackEmittedStreams are always present, the rest are server-defined.
export interface ProjectionConfig {
  emitEnabled: boolean;
  trackEmittedStreams: boolean;
  [key: string]: any;
}

// A single projection's details from the HTTP client. Server-defined stats
// fields vary by projection, so the shape is left extensible.
export interface HTTPProjectionDetail {
  name: string;
  [key: string]: any;
}

export interface HTTPProjectionsInfo {
  projections: HTTPProjectionDetail[];
}

// Persistent subscription stats. Server-defined fields vary, so extensible.
export interface PersistentSubscriptionInfo {
  eventStreamId?: string;
  groupName?: string;
  status?: string;
  [key: string]: any;
}

// Result of persistentSubscriptions.getEvents. entries carry the events plus
// dynamically named ack/nack/link functions.
export interface PersistentSubscriptionEvents {
  entries: object[];
  [link: string]: any;
}

export interface EventStoreCatchUpSubscription {
  stop(): void;
  close(): Promise<void>;
}

export interface SubscribeToStreamFromSettings {
  resolveLinkTos?: boolean;
  readBatchSize?: number;
}

export interface SubscribeToAllSettings {
  resolveLinkTos?: boolean;
  // Optional server-side filter, built with eventTypeFilter / streamNameFilter / excludeSystemEvents.
  filter?: Filter;
}

export interface MappedEventAppearedCallback<TSubscription> {
  (subscription: TSubscription, event: Event): void | Promise<void>;
}

export interface GRPCSubscriptionDroppedCallback<TSubscription> {
  (subscription: TSubscription): void | Promise<void>;
}

export interface EventEnumeratorResult {
  isEndOfStream: boolean;
  events: Event[];
}

export class EventFactory {
  newEvent: (eventType: string, data: object, metadata?: object, eventId?: string) => NewEvent;
}

export class HTTPClient {
  constructor(config: HTTPConfig);
  checkStreamExists(streamName: string): Promise<boolean>;
  setStreamMetadata(streamName: string, metadata: StreamMetadata, options?: StreamMetadataOptions): Promise<void>;
  writeEvent(
    streamName: string,
    eventType: string,
    data: object,
    metaData?: object,
    options?: HTTPWriteEventOptions
  ): Promise<void>;
  writeEvents(streamName: string, events: NewEvent[], options?: HTTPWriteEventOptions): Promise<void>;
  getAllStreamEvents(
    streamName: string,
    chunkSize?: number,
    startPosition?: number,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): Promise<Event[]>;
  getEvents(
    streamName: string,
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): Promise<Event[]>;
  getEventsByType(
    streamName: string,
    eventTypes: string[],
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  readEventsForward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): Promise<HTTPReadResult>;
  readEventsBackward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): Promise<HTTPReadResult>;
  iterateAllStreamEvents(
    streamName: string,
    chunkSize?: number,
    startPosition?: number,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): AsyncIterableIterator<Event>;
  iterateEvents(
    streamName: string,
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): AsyncIterableIterator<Event>;
  iterateEventsForward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): AsyncIterableIterator<Event>;
  iterateEventsBackward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean,
    embed?: EmbedType
  ): AsyncIterableIterator<Event>;
  iterateEventsByType(
    streamName: string,
    eventTypes: string[],
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  deleteStream(streamName: string, hardDelete?: boolean): Promise<void>;
  ping(): Promise<void>;
  admin: {
    scavenge(): Promise<void>;
    shutdown(): Promise<void>;
  };
  projections: {
    start(name: string): Promise<void>;
    stop(name: string): Promise<void>;
    reset(name: string): Promise<void>;
    assert(
      name: string,
      projectionContent: string,
      mode?: ProjectionMode,
      enabled?: boolean,
      checkpointsEnabled?: boolean,
      emitEnabled?: boolean,
      trackEmittedStreams?: boolean
    ): Promise<void>;
    remove(name: string, deleteCheckpointStream?: boolean, deleteStateStream?: boolean): Promise<void>;
    config(name: string): Promise<ProjectionConfig>;
    getState(name: string, options?: ProjectionStateOptions): Promise<object>;
    getResult(name: string, options?: ProjectionStateOptions): Promise<object>;
    getInfo(name: string, includeConfig?: boolean): Promise<HTTPProjectionDetail | undefined>;
    getAllProjectionsInfo(): Promise<HTTPProjectionsInfo>;
    disableAll(): Promise<void[]>;
    enableAll(): Promise<void[]>;
    restartSubsystem(): Promise<void>;
  };
  persistentSubscriptions: {
    assert(
      name: string,
      streamName: string,
      options?: HTTPPersistentSubscriptionOptions
    ): Promise<PersistentSubscriptionAssertResult>;
    remove(name: string, streamName: string): Promise<void>;
    getEvents(
      name: string,
      streamName: string,
      count?: number,
      embed?: EmbedType
    ): Promise<PersistentSubscriptionEvents>;
    getSubscriptionInfo(name: string, streamName: string): Promise<PersistentSubscriptionInfo>;
    getAllSubscriptionsInfo(): Promise<PersistentSubscriptionInfo[]>;
    getStreamSubscriptionsInfo(streamName: string): Promise<PersistentSubscriptionInfo[]>;
    restartSubsystem(): Promise<void>;
  };
}

export class TCPClient {
  constructor(config: TCPConfig);
  checkStreamExists(streamName: string): Promise<boolean>;
  setStreamMetadata(
    streamName: string,
    metadata: StreamMetadata,
    options?: StreamMetadataOptions
  ): Promise<TCPWriteResult>;
  writeEvent(
    streamName: string,
    eventType: string,
    data: object,
    metaData?: object,
    options?: TCPWriteEventOptions
  ): Promise<TCPWriteResult>;
  writeEvents(streamName: string, events: NewEvent[], options?: TCPWriteEventsOptions): Promise<TCPWriteResult>;
  getAllStreamEvents(
    streamName: string,
    chunkSize?: number,
    startPosition?: number,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  getEvents(
    streamName: string,
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  getEventsByType(
    streamName: string,
    eventTypes: string[],
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  readEventsForward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): Promise<TCPReadResult>;
  readEventsBackward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): Promise<TCPReadResult>;
  iterateAllStreamEvents(
    streamName: string,
    chunkSize?: number,
    startPosition?: number,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEvents(
    streamName: string,
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEventsForward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEventsBackward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEventsByType(
    streamName: string,
    eventTypes: string[],
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  deleteStream(streamName: string, hardDelete?: boolean): Promise<TCPDeleteResult>;
  eventEnumerator(
    streamName: string,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): {
    first(count: number): Promise<EventEnumeratorResult>;
    last(count: number): Promise<EventEnumeratorResult>;
    previous(count: number): Promise<EventEnumeratorResult>;
    next(count: number): Promise<EventEnumeratorResult>;
  };
  subscribeToStream(
    streamName: string,
    onEventAppeared?: MappedEventAppearedCallback<EventStoreSubscription>,
    onDropped?: SubscriptionDroppedCallback<EventStoreSubscription>,
    resolveLinkTos?: boolean
  ): Promise<EventStoreSubscription>;
  subscribeToStreamFrom(
    streamName: string,
    fromEventNumber?: number,
    onEventAppeared?: MappedEventAppearedCallback<EventStoreCatchUpSubscription>,
    onLiveProcessingStarted?: LiveProcessingStartedCallback,
    onDropped?: SubscriptionDroppedCallback<EventStoreCatchUpSubscription>,
    settings?: SubscribeToStreamFromSettings
  ): Promise<EventStoreCatchUpSubscription>;
  close(): Promise<void>;
  getPool(): Promise<ConnectionPool<object>>;
  closeAllPools(): Promise<void>;
}

export class GRPCClient {
  constructor(config: GRPCConfig);
  getStreamMetadata(streamName: string): Promise<GetStreamMetadataResult>;
  setStreamMetadata(
    streamName: string,
    metadata: StreamMetadata,
    options?: SetStreamMetadataOptions
  ): Promise<GRPCAppendResult>;
  checkStreamExists(streamName: string): Promise<boolean>;
  writeEvent(
    streamName: string,
    eventType: string,
    data: object,
    metaData?: object,
    options?: GRPCWriteEventOptions
  ): Promise<GRPCAppendResult>;
  writeEvents(streamName: string, events: NewEvent[], options?: GRPCWriteEventOptions): Promise<GRPCAppendResult>;
  multiStreamWrite(writes: GRPCMultiStreamWrite[]): Promise<GRPCMultiAppendResult>;
  multiStreamWriteCrossStreamConsistency(
    writes: GRPCMultiStreamWriteRecord[],
    checks?: GRPCConsistencyCheck[]
  ): Promise<GRPCMultiAppendResult>;
  getAllStreamEvents(
    streamName: string,
    chunkSize?: number,
    startPosition?: number,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  getEvents(
    streamName: string,
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  getEventsByType(
    streamName: string,
    eventTypes: string[],
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): Promise<Event[]>;
  readEventsForward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): Promise<GRPCStreamReadResult>;
  readEventsBackward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): Promise<GRPCStreamReadResult>;
  readAllEvents(
    startPosition?: ReadPosition,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean,
    filter?: Filter
  ): Promise<Event[]>;
  readAllEventsForward(
    startPosition?: ReadPosition,
    count?: number,
    resolveLinkTos?: boolean,
    filter?: Filter
  ): Promise<GRPCReadResult>;
  readAllEventsBackward(
    startPosition?: ReadPosition,
    count?: number,
    resolveLinkTos?: boolean,
    filter?: Filter
  ): Promise<GRPCReadResult>;
  iterateAllStreamEvents(
    streamName: string,
    chunkSize?: number,
    startPosition?: number,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEvents(
    streamName: string,
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEventsForward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEventsBackward(
    streamName: string,
    startPosition?: number,
    count?: number,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateEventsByType(
    streamName: string,
    eventTypes: string[],
    startPosition?: number,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean
  ): AsyncIterableIterator<Event>;
  iterateAllEvents(
    startPosition?: ReadPosition,
    count?: number,
    direction?: ReadDirection,
    resolveLinkTos?: boolean,
    filter?: Filter
  ): AsyncIterableIterator<Event>;
  iterateAllEventsForward(
    startPosition?: ReadPosition,
    count?: number,
    resolveLinkTos?: boolean,
    filter?: Filter
  ): AsyncIterableIterator<Event>;
  iterateAllEventsBackward(
    startPosition?: ReadPosition,
    count?: number,
    resolveLinkTos?: boolean,
    filter?: Filter
  ): AsyncIterableIterator<Event>;
  deleteStream(streamName: string, hardDelete?: boolean): Promise<GRPCDeleteResult>;
  subscribeToStream(
    streamName: string,
    onEventAppeared?: MappedEventAppearedCallback<StreamSubscription>,
    onDropped?: GRPCSubscriptionDroppedCallback<StreamSubscription>,
    resolveLinkTos?: boolean
  ): Promise<StreamSubscription>;
  subscribeToStreamFrom(
    streamName: string,
    fromEventNumber?: number,
    onEventAppeared?: MappedEventAppearedCallback<StreamSubscription>,
    onLiveProcessingStarted?: LiveProcessingStartedCallback,
    onDropped?: GRPCSubscriptionDroppedCallback<StreamSubscription>,
    settings?: SubscribeToStreamFromSettings
  ): Promise<StreamSubscription>;
  subscribeToAll(
    fromPosition?: ReadPosition,
    onEventAppeared?: MappedEventAppearedCallback<AllStreamSubscription>,
    onLiveProcessingStarted?: LiveProcessingStartedCallback,
    onDropped?: GRPCSubscriptionDroppedCallback<AllStreamSubscription>,
    settings?: SubscribeToAllSettings
  ): Promise<AllStreamSubscription>;
  createPersistentSubscriptionToStream(
    streamName: string,
    groupName: string,
    settings?: GRPCPersistentSubscriptionOptions
  ): Promise<void>;
  createPersistentSubscriptionToAll(groupName: string, settings?: PersistentSubscriptionToAllOptions): Promise<void>;
  subscribeToPersistentSubscriptionToStream(
    streamName: string,
    groupName: string,
    onEventAppeared?: MappedEventAppearedCallback<PersistentSubscriptionToStream>,
    onDropped?: GRPCSubscriptionDroppedCallback<PersistentSubscriptionToStream>,
    settings?: { bufferSize?: number },
    duplexOptions?: object
  ): Promise<PersistentSubscriptionToStream>;
  subscribeToPersistentSubscriptionToAll(
    groupName: string,
    onEventAppeared?: MappedEventAppearedCallback<PersistentSubscriptionToAll>,
    onDropped?: GRPCSubscriptionDroppedCallback<PersistentSubscriptionToAll>,
    settings?: { bufferSize?: number },
    duplexOptions?: object
  ): Promise<PersistentSubscriptionToAll>;
  projections: {
    start(name: string): Promise<void>;
    stop(name: string): Promise<void>;
    reset(name: string): Promise<void>;
    remove(name: string, deleteCheckpointStream?: boolean, deleteStateStream?: boolean): Promise<void>;
    getAllProjectionsInfo(): Promise<ProjectionDetails[]>;
    getState(name: string, options?: ProjectionStateOptions): Promise<object>;
    getResult(name: string, options?: ProjectionStateOptions): Promise<object>;
    getInfo(name: string): Promise<ProjectionDetails | undefined>;
    assert(
      name: string,
      projectionContent: string,
      mode?: ProjectionMode,
      enabled?: boolean,
      checkpointsEnabled?: boolean,
      emitEnabled?: boolean,
      trackEmittedStreams?: boolean
    ): Promise<void>;
    disableAll(): Promise<void[]>;
    enableAll(): Promise<void[]>;
    restartSubsystem(): Promise<void>;
  };
  persistentSubscriptions: {
    assert(name: string, streamName: string, options?: GRPCPersistentSubscriptionOptions): Promise<void>;
    assertToAll(name: string, options?: PersistentSubscriptionToAllOptions): Promise<void>;
    remove(name: string, streamName: string): Promise<void>;
    removeToAll(name: string): Promise<void>;
    getSubscriptionInfo(name: string, streamName: string): Promise<PersistentSubscriptionInfo>;
    getToAllSubscriptionInfo(name: string): Promise<PersistentSubscriptionInfo>;
    getAllSubscriptionsInfo(): Promise<PersistentSubscriptionInfo[]>;
    getToAllSubscriptionsInfo(): Promise<PersistentSubscriptionInfo[]>;
    getStreamSubscriptionsInfo(streamName: string): Promise<PersistentSubscriptionInfo[]>;
    replayParkedMessagesToStream(
      name: string,
      streamName: string,
      options?: ReplayParkedMessagesOptions
    ): Promise<void>;
    replayParkedMessagesToAll(name: string, options?: ReplayParkedMessagesOptions): Promise<void>;
    restartSubsystem(): Promise<void>;
  };
  close(): Promise<void>;
  getConnection(): Promise<KurrentDBClient>;
  closeAllConnections(): Promise<void>;
}

// Server-side filter builders for the gRPC readAll / subscribeToAll methods.
export { eventTypeFilter, streamNameFilter, excludeSystemEvents } from '@kurrent/kurrentdb-client';

declare const KurrentDB: {
  EventFactory: typeof EventFactory;
  HTTPClient: typeof HTTPClient;
  TCPClient: typeof TCPClient;
  GRPCClient: typeof GRPCClient;
  eventTypeFilter: typeof import('@kurrent/kurrentdb-client').eventTypeFilter;
  streamNameFilter: typeof import('@kurrent/kurrentdb-client').streamNameFilter;
  excludeSystemEvents: typeof import('@kurrent/kurrentdb-client').excludeSystemEvents;
};

export default KurrentDB;
