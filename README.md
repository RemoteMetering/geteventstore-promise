# @metronomic/kurrentdb-client
A Node.js KurrentDB(previously EventStoreDB) client API wrapper.

The package ships three clients over three transports:

* **gRPC** (`GRPCClient`) talks to modern KurrentDB. This is the recommended transport for new work. Uses the official [@kurrent/kurrentdb-client](https://www.npmjs.com/package/@kurrent/kurrentdb-client) package.
* **HTTP** (`HTTPClient`) talks to the KurrentDB HTTP API.
* **TCP** (`TCPClient`) talks to the legacy KurrentDB TCP API. Uses the [node-eventstore-client](https://www.npmjs.com/package/node-eventstore-client) package.

All three expose the same core methods, so you can switch transport through configuration alone.

# Installation
> yarn add @metronomic/kurrentdb-client

In your application:
> import KurrentDB from '@metronomic/kurrentdb-client';

# Common methods

Available on all three clients.

* getEvents(streamName, startPosition, count, direction, resolveLinkTos)
* getAllStreamEvents(streamName, chunkSize, startPosition, resolveLinkTos)
* getEventsByType(streamName, eventTypes, startPosition, count, direction, resolveLinkTos)
* readEventsForward(streamName, startPosition, count, resolveLinkTos)
* readEventsBackward(streamName, startPosition, count, resolveLinkTos)
* writeEvent(streamName, eventType, data, metaData, options)
* writeEvents(streamName, events, options)
* deleteStream(streamName, hardDelete)
* checkStreamExists(streamName)
* iterateEvents(streamName, startPosition, count, direction, resolveLinkTos)
* iterateEventsForward(streamName, startPosition, count, resolveLinkTos)
* iterateEventsBackward(streamName, startPosition, count, resolveLinkTos)
* iterateAllStreamEvents(streamName, chunkSize, startPosition, resolveLinkTos)
* iterateEventsByType(streamName, eventTypes, startPosition, count, direction, resolveLinkTos)

# Persistent subscriptions

Available on the gRPC and HTTP clients. `getEvents` is HTTP only.

* assert(subscriptionName, streamName, options)
* getEvents(subscriptionName, streamName, count, embed)
* getSubscriptionInfo(subscriptionName, streamName)
* getStreamSubscriptionsInfo(streamName)
* getAllSubscriptionsInfo()
* remove(subscriptionName, streamName)

# Projections

Available on the gRPC and HTTP clients. `config` is HTTP only, and `getInfo`'s `includeConfig` argument applies to HTTP only.

* start(projectionName)
* stop(projectionName)
* reset(projectionName)
* remove(projectionName, deleteCheckpointStream, deleteStateStream)
* config(projectionName)
* getState(projectionName, options)
* getResult(projectionName, options)
* getInfo(projectionName, includeConfig)
* assert(projectionName, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled, trackEmittedStreams)
* enableAll()
* disableAll()
* getAllProjectionsInfo()

# Preferred methods: iterate over read

Each client exposes buffering read methods (`getEvents`, `getAllStreamEvents`, `readEventsForward`, `readEventsBackward`) and async iterator methods (`iterateEvents`, `iterateAllStreamEvents`, `iterateEventsByType`, and on gRPC also `iterateAllEvents`).

Prefer the `iterate*` methods. They stream events one at a time from the server, reducing the memory footprint. e.g `iterateAllEventsForward`

---

# gRPC Client

The gRPC client is the recommended transport for new work.

## Config

The protocol defaults to `kurrentdb+discover`, which lets the client discover cluster nodes. Set `useSslConnection` for a secure connection and `tlsCAFile` to point at a CA certificate when the server uses one.

```javascript
const client = new KurrentDB.GRPCClient({
	hostname: 'localhost',
	port: 2113,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});

// Secure
const secureClient = new KurrentDB.GRPCClient({
	hostname: 'localhost',
	port: 2113,
	useSslConnection: true,
	tlsCAFile: '/path/to/ca.crt',
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});

// Clustering - Gossip Seeds
const clusterClient = new KurrentDB.GRPCClient({
	gossipSeeds: [
		{ hostname: '192.168.0.10', port: 2113 },
		{ hostname: '192.168.0.11', port: 2113 },
		{ hostname: '192.168.0.12', port: 2113 }
	],
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});
```

## Additional gRPC methods

Methods available on the gRPC client beyond the common set above. The `readAll*` and `iterateAll*` methods read across all streams using the server-wide `$all` stream. The `subscribe*` and pool methods (`close`, `getPool`, `closeAllPools`) are shared with the TCP client.

* getStreamMetadata(streamName)
* readAllEvents(startPosition, count, direction, resolveLinkTos)
* readAllEventsForward(startPosition, count, resolveLinkTos)
* readAllEventsBackward(startPosition, count, resolveLinkTos)
* iterateAllEvents(startPosition, count, direction, resolveLinkTos)
* iterateAllEventsForward(startPosition, count, resolveLinkTos)
* iterateAllEventsBackward(startPosition, count, resolveLinkTos)
* subscribeToStream(streamName, onEventAppeared, onDropped, resolveLinkTos)
* subscribeToStreamFrom(streamName, fromEventNumber, onEventAppeared, onDropped, settings)
* createPersistentSubscriptionToStream(streamName, groupName, settings)
* subscribeToPersistentSubscriptionToStream(streamName, groupName, onEventAppeared, onDropped, settings, duplexOptions)
* close()
* getPool()
* closeAllPools()

---

# HTTP Client

## Config

```javascript
const client = new KurrentDB.HTTPClient({
	hostname: 'localhost',
	port: 2113,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});

// Secure
const secureClient = new KurrentDB.HTTPClient({
	protocol: 'https',
	hostname: 'localhost',
	port: 2113,
	validateServer: true, //defaults to `true` when `protocol` is `https`, set to `false` when using self-signed certs
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});
```

## Admin methods (only issues commands)

Available on the HTTP client only.

* admin.scavenge()
* admin.shutdown()

## Additional HTTP methods

* ping()

---

# TCP Client (Legacy)

## Config

```javascript
import { v4 as generateId } from 'uuid';

const client = new KurrentDB.TCPClient({
	hostname: 'localhost',
	port: 1113,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		min: 0,
		max: 10
	}
});

// Secure
const secureClient = new KurrentDB.TCPClient({
	hostname: 'localhost',
	port: 1113,
	useSslConnection: true,
	validateServer: true, //defaults to `true` when `useSslConnection` is `true`, set to `false` when using self-signed certs
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		min: 0,
		max: 10
	}
});

// Override connection name
const namedClient = new KurrentDB.TCPClient({
	hostname: 'localhost',
	port: 1113,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		min: 0,
		max: 10
	},
	connectionNameGenerator: () => `APP_NAME_${generateId()}`
});

// Clustering - Gossip Seeds
const clusterClient = new KurrentDB.TCPClient({
	gossipSeeds: [
		{ hostname: '192.168.0.10', port: 2113 },
		{ hostname: '192.168.0.11', port: 2113 },
		{ hostname: '192.168.0.12', port: 2113 }
	],
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		min: 0,
		max: 10
	}
});

// Clustering - DNS Discovery
const discoverClient = new KurrentDB.TCPClient({
	protocol: 'discover',
	hostname: 'my.host',
	port: 2113,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		min: 0,
		max: 10
	}
});
```

## Additional TCP methods

* subscribeToStream(streamName, onEventAppeared, onDropped, resolveLinkTos)
* subscribeToStreamFrom(streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings)
* eventEnumerator(streamName, direction, resolveLinkTos)
* close()
* getPool()
* closeAllPools()

## License

MIT