import {
	EventStoreSubscription,
	EventStoreCatchUpSubscription,
	WriteResult as TCPWriteResult,
	DeleteResult as TCPDeleteResult,
	LiveProcessingStartedCallback,
	SubscriptionDroppedCallback,
	ConnectionSettings,
	EventStorePersistentSubscription
}  from "node-eventstore-client";

import {
	Options as TCPPoolOptions,
	Pool as TCPPool
} from "generic-pool";

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
	data: object;
	metadata?: object;
	isJson?: boolean;
	positionStreamId?: string;
	positionEventId?: string;
	positionEventNumber?: number;
	positionCreated?: string;
}

export type ProjectionMode = "onetime" | "continuous";

export type ReadDirection = "forward" | "backward";

export type EmbedType = "body" | "rich" | "PrettyBody" | "TryHarder";

export interface UserCredentials {
	readonly username: string;
	readonly password: string;
}

export interface GossipSeed {
	readonly hostname: string;
	readonly port: number;
}

export interface HTTPConfig {
	hostname: string;
	port: number;
	credentials: UserCredentials;
}

export interface TCPConfig extends ConnectionSettings {
	hostname?: string;
	port?: number;
	protocol?: string;
	gossipSeeds?: GossipSeed[];
	credentials: UserCredentials;
	poolOptions?: TCPPoolOptions;
}

export interface HTTPWriteEventOptions  {
	expectedVersion?: number;
}

export interface TCPWriteEventOptions {
	expectedVersion?: number;
}

export interface TCPWriteEventsOptions extends TCPWriteEventOptions {
	transactionWriteSize?: number;
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

export interface HTTPReadResultAuthor {
	name: string;
}

export interface HTTPReadResultLink {
	uri: string;
	relation: string;
}

export interface HTTPReadResult {
	title: string,
	id: string,
	updated: string,
	streamId: string,
	author: HTTPReadResultAuthor,
	headOfStream: boolean,
	isEndOfStream: boolean,
	readDirection: ReadDirection,
	fromEventNumber: number;
	nextEventNumber: number;
	selfUrl: string,
	links: HTTPReadResultLink[],
	events: Event[]
}

export interface ProjectionStateOptions {
	partition?: string;
}

export interface PersistentSubscriptionOptions {
	resolveLinkTos?: boolean;
	startFrom?: number;
	extraStatistics?: boolean;
	messageTimeout?: number;
	maxRetryCount?: number;
	liveBufferSize?: number;
	readBatchSize?: number;
	historyBufferSize?: number;
	checkPointAfter?: number;
	minCheckPointCount?: number;
	maxCheckPointCount?: number;
	maxSubscriberCount?: number;
	namedConsumerStrategy?: string;
}

export interface PersistentSubscriptionAssertResult {
	correlationId: string;
	reason: string;
	result: string;
	msgTypeId: number;
}

export interface SubscribeToStreamFromSettings {
	resolveLinkTos?: boolean;
	readBatchSize?: number;
}

export interface MappedEventAppearedCallback<TSubscription> {
    (subscription: TSubscription, event: Event): void | Promise<void>;
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
	writeEvent(streamName: string, eventType: string, data: object, metaData?: object, options?: HTTPWriteEventOptions): Promise<void>;
	writeEvents(streamName: string, events: NewEvent[], options?: HTTPWriteEventOptions): Promise<void>;
	getAllStreamEvents(streamName: string, chunkSize?: number, startPosition?: number, resolveLinkTos?: boolean, embed?: EmbedType): Promise<Event[]>;
	getEvents(streamName: string, startPosition?: number, count?: number, direction?: ReadDirection, resolveLinkTos?: boolean, embed?: EmbedType): Promise<Event[]>;
	getEventsByType(streamName: string, eventTypes: string[], startPosition?: number, count?: number, direction?: ReadDirection, resolveLinkTos?: boolean): Promise<Event[]>;
	readEventsForward(streamName: string, startPosition?: number, count?: number, resolveLinkTos?: boolean, embed?: EmbedType): Promise<HTTPReadResult>;
	readEventsBackward(streamName: string, startPosition?: number, count?: number, resolveLinkTos?: boolean, embed?: EmbedType): Promise<HTTPReadResult>;
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
		assert(name: string, projectionContent: string, mode?: ProjectionMode, enabled?: boolean, checkpointsEnabled?: boolean, emitEnabled?: boolean, trackEmittedStreams?: boolean): Promise<void>;
		remove(name: string, deleteCheckpointStream?: boolean, deleteStateStream?: boolean): Promise<void>;
		config(name: string): Promise<object>;
		getState(name: string, options?: ProjectionStateOptions): Promise<object>;
		getResult(name: string, options?: ProjectionStateOptions): Promise<object>;
		getInfo(name: string, includeConfig?: boolean): Promise<object>;
		getAllProjectionsInfo(): Promise<object>;
		disableAll(): Promise<void>;
		enableAll(): Promise<void>;
	};
	persistentSubscriptions: {
		assert(name: string, streamName: string, options?: PersistentSubscriptionOptions): Promise<PersistentSubscriptionAssertResult>;
		remove(name: string, streamName: string): Promise<void>;
		getEvents(name: string, streamName: string, count?: number, embed?: EmbedType): Promise<object>;
		getSubscriptionInfo(name: string, streamName: string): Promise<object>;
		getAllSubscriptionsInfo(): Promise<object>;
		getStreamSubscriptionsInfo(streamName: string): Promise<object>;
	};
}

export class TCPClient {
	constructor(config: TCPConfig);
	checkStreamExists(streamName: string): Promise<boolean>;
	writeEvent(streamName: string, eventType: string, data: object, metaData?: object, options?: TCPWriteEventOptions): Promise<TCPWriteResult>;
	writeEvents(streamName: string, events: NewEvent[], options?: TCPWriteEventsOptions): Promise<TCPWriteResult>;
	getAllStreamEvents(streamName: string, chunkSize?: number, startPosition?: number, resolveLinkTos?: boolean): Promise<Event[]>;
	getEvents(streamName: string, startPosition?: number, count?: number, direction?: ReadDirection, resolveLinkTos?: boolean): Promise<Event[]>;
	getEventsByType(streamName: string, eventTypes: string[], startPosition?: number, count?: number, direction?: ReadDirection, resolveLinkTos?: boolean): Promise<Event[]>;
	readEventsForward(streamName: string, startPosition?: number, count?: number, resolveLinkTos?: boolean): Promise<TCPReadResult>;
	readEventsBackward(streamName: string, startPosition?: number, count?: number, resolveLinkTos?: boolean): Promise<TCPReadResult>;
	deleteStream(streamName: string, hardDelete?: boolean): Promise<TCPDeleteResult>;
	eventEnumerator(streamName: string, direction?: ReadDirection, resolveLinkTos?: boolean): {
		first(count: number): Promise<EventEnumeratorResult>;
		last(count: number): Promise<EventEnumeratorResult>;
		previous(count: number): Promise<EventEnumeratorResult>;
		next(count: number): Promise<EventEnumeratorResult>;
	};
	subscribeToStream(streamName: string, onEventAppeared?: MappedEventAppearedCallback<EventStoreSubscription>, onDropped?: SubscriptionDroppedCallback<EventStoreSubscription>, resolveLinkTos?: boolean): Promise<EventStoreSubscription>;
	subscribeToStreamFrom(streamName: string, fromEventNumber?: number, onEventAppeared?: MappedEventAppearedCallback<EventStoreCatchUpSubscription>, onLiveProcessingStarted?: LiveProcessingStartedCallback, onDropped?: SubscriptionDroppedCallback<EventStoreCatchUpSubscription>, settings?: SubscribeToStreamFromSettings): Promise<EventStoreCatchUpSubscription>;
	connectToPersistentSubscription(streamName: string, groupName: string, onEventAppeared?: MappedEventAppearedCallback<EventStoreCatchUpSubscription>, onDropped?: SubscriptionDroppedCallback<EventStoreSubscription>): Promise<EventStorePersistentSubscription>;
	close(): Promise<void>;
	getPool(): Promise<TCPPool<object>>;
	closeAllPools(): Promise<void>;
}

//Deprecated
export class tcp extends TCPClient {}
export class http extends HTTPClient {}

export namespace eventFactory {
	const NewEvent: (eventType: string, data: object, metadata: object, eventId: string) => NewEvent;
}
