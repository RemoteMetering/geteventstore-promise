import { 
	EventStoreSubscription, 
	EventStoreCatchUpSubscription, 
	WriteResult as TCPWriteResult, 
	DeleteResult as TCPDeleteResult,
	EventAppearedCallback,
	LiveProcessingStartedCallback,
	SubscriptionDroppedCallback
}  from 'node-eventstore-client';

import { 
	Options as TCPPoolOptions,
	Pool as TCPPool 
} from "generic-pool";

export class NewEvent {
	eventId: string;
	eventType: string;
	data: object;
	metadata?: object;
}

export class Event {
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

export class UserCredentials {
	readonly username: string;
	readonly password: string;
}

export class GossipSeed {
	readonly hostname: string;
	readonly port: number;
}

export class HTTPConfig {
	hostname: string;
	port: number;
	credentials: UserCredentials;
}

export class TCPConfig {
	hostname?: string;
	port?: number;
	protocol?: string;
	gossipSeeds?: GossipSeed[];
	credentials: UserCredentials;
	poolOptions: TCPPoolOptions;
}

export class HTTPWriteEventOptions  {
	expectedVersion: number;
}

export class TCPWriteEventOptions {
	expectedVersion: number;
}

export class TCPWriteEventsOptions extends TCPWriteEventOptions {
	transactionWriteSize: number;
}

export class ProjectionStateOptions {
	partition: string;
}

export class PersistentSubscriptionOptions {
	resolveLinkTos: boolean;
	startFrom: number;
	extraStatistics: boolean;
	messageTimeout: number;
	maxRetryCount: number;
	liveBufferSize: number;
	readBatchSize: number;
	historyBufferSize: number;
	checkPointAfter: number;
	minCheckPointCount: number;
	maxCheckPointCount: number;
	maxSubscriberCount: number;
	namedConsumerStrategy: string;
}

export class PersistentSubscriptionAssertResult {
	correlationId: string;
	reason: string;
	result: string;
	msgTypeId: number;
}

export class SubscribeToStreamFromSettings {
	resolveLinkTos: boolean;
	readBatchSize: number;
}

export class EventEnumeratorResult {
	isEndOfStream: boolean;
	events: Event[];
}

type NewEventFunction = (eventType: string, data: object, metadata: object, eventId: string) => NewEvent;

export class EventFactory {
	newEvent: NewEventFunction;
}

export class HTTPClient {
	constructor(config: HTTPConfig);
	checkStreamExists(streamName: string): Promise<boolean>;
	writeEvent(streamName: string, eventType: string, data: object, metaData?: object, options?: HTTPWriteEventOptions): Promise<void>;
	writeEvents(streamName: string, events: NewEvent[], options?: HTTPWriteEventOptions): Promise<void>;
	getAllStreamEvents(streamName: string, chunkSize?: number, startPosition?: number, resolveLinkTos?: boolean, embed?: EmbedType): Promise<Event[]>;
	getEvents(streamName: string, startPosition?: number, length?: number, direction?: ReadDirection, resolveLinkTos?: boolean, embed?: EmbedType): Promise<Event[]>;
	getEventsByType(streamName: string, eventTypes: string[], startPosition?: number, length?: number, direction?: ReadDirection, resolveLinkTos?: boolean): Promise<Event[]>;
	deleteStream(streamName: string, hardDelete?: boolean): Promise<void>;
	ping(): Promise<object>;
	admin: {
		scavenge(): Promise<void>;
		shutdown(): Promise<void>;
	};
	projections: {
		start(name: string): Promise<void>;
		stop(name: string): Promise<void>;
		reset(name: string): Promise<void>;
		assert(name: string, projectionContent: string, mode?: ProjectionMode, enabled?: boolean, checkpointsEnabled?: boolean, emitEnabled?: boolean): Promise<void>;
		remove(name: string, deleteCheckpointStream?: boolean, deleteStateStream?: boolean): Promise<void>;
		getState(name: string, options?: ProjectionStateOptions): Promise<object>;
		getInfo(name: string): Promise<object>;
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
	getEvents(streamName: string, startPosition?: number, length?: number, direction?: ReadDirection, resolveLinkTos?: boolean): Promise<Event[]>;
	getEventsByType(streamName: string, eventTypes: string[], startPosition?: number, length?: number, direction?: ReadDirection, resolveLinkTos?: boolean): Promise<Event[]>;
	deleteStream(streamName: string, hardDelete?: boolean): Promise<TCPDeleteResult>;
	eventEnumerator(streamName: string, direction?: ReadDirection, resolveLinkTos?: boolean): {
		first(length: number): Promise<EventEnumeratorResult>;
		last(length: number): Promise<EventEnumeratorResult>;
		previous(length: number): Promise<EventEnumeratorResult>;
		next(length: number): Promise<EventEnumeratorResult>;
	};
	subscribeToStream(streamName: string, onEventAppeared?: EventAppearedCallback<EventStoreSubscription>, onDropped?: SubscriptionDroppedCallback<EventStoreSubscription>, resolveLinkTos?: boolean): Promise<EventStoreSubscription>;
	subscribeToStreamFrom(streamName: string, fromEventNumber?: number, onEventAppeared?: EventAppearedCallback<EventStoreCatchUpSubscription>, onLiveProcessingStarted?: LiveProcessingStartedCallback, onDropped?: SubscriptionDroppedCallback<EventStoreCatchUpSubscription>, settings?: SubscribeToStreamFromSettings): Promise<EventStoreCatchUpSubscription>;
	close(): Promise<void>;
	getPool(): Promise<TCPPool<{}>>;
	closeAllPools(): Promise<void>;
}

//Deprecated
export class tcp extends TCPClient {}
export class http extends HTTPClient {}

export namespace eventFactory {
	const NewEvent: NewEventFunction;
}
