# @metronomic/kurrentdb-client

A Node.js KurrentDB(previously EventStoreDB) client API wrapper.

The package ships three clients over three transports:

- **gRPC** (`GRPCClient`) talks to modern KurrentDB. This is the recommended transport for new work. Uses the official [@kurrent/kurrentdb-client](https://www.npmjs.com/package/@kurrent/kurrentdb-client) package.
- **HTTP** (`HTTPClient`) talks to the KurrentDB HTTP API.
- **TCP** (`TCPClient`) talks to the KurrentDB Legacy TCP API. This API is supported on KurrentDB >= 24.6 on a licensed server through a plugin. Uses the [node-eventstore-client](https://www.npmjs.com/package/node-eventstore-client) package.

All three expose the same core methods, so you can switch transport through configuration alone.

# Installation

> pnpm add @metronomic/kurrentdb-client

In your application:

> import KurrentDB from '@metronomic/kurrentdb-client';

# Common methods

Available on all three clients.

- getEvents(streamName, startPosition, count, direction, resolveLinkTos)
- getAllStreamEvents(streamName, chunkSize, startPosition, resolveLinkTos)
- getEventsByType(streamName, eventTypes, startPosition, count, direction, resolveLinkTos)
- readEventsForward(streamName, startPosition, count, resolveLinkTos)
- readEventsBackward(streamName, startPosition, count, resolveLinkTos)
- writeEvent(streamName, eventType, data, metaData, options)
- writeEvents(streamName, events, options)
- deleteStream(streamName, hardDelete)
- checkStreamExists(streamName)
- setStreamMetadata(streamName, metadata, options)
- iterateEvents(streamName, startPosition, count, direction, resolveLinkTos)
- iterateEventsForward(streamName, startPosition, count, resolveLinkTos)
- iterateEventsBackward(streamName, startPosition, count, resolveLinkTos)
- iterateAllStreamEvents(streamName, chunkSize, startPosition, resolveLinkTos)
- iterateEventsByType(streamName, eventTypes, startPosition, count, direction, resolveLinkTos)

# Positions and expected versions

The clients accept the same values, so a value means the same thing on every transport.

- **Start positions:** leaving the position out reads from the start, or from the end on a backward read. `-1` means the end, as on TCP. A revision may be a Number, a BigInt or a decimal string, such as a gRPC result serialises to. An invalid position throws rather than reading from the start.
- **`$all` positions:** gRPC only. These are `'start'`, `'end'` or a `{ commit, prepare }` pair of Numbers, BigInts or decimal strings.
- **`expectedVersion`:** a revision as above, `-2` or `'any'` to skip the check, `-1` or `'no_stream'` for a missing stream, and `-4` or `'stream_exists'` for an existing one. Leaving it out means Any. An invalid value throws `Invalid expectedVersion`, because falling back to Any would silently drop the concurrency check.
- **`eventTypes`:** `getEventsByType` and `iterateEventsByType` take one event type as a string, or several as an array.

# Stream metadata

`setStreamMetadata` takes the friendly shape: `maxAge`, `maxCount`, `truncateBefore`, `cacheControl`, `acl` and any custom properties. Every client validates it the same way. The four system values must be integers. `acl` must be a string such as `'$userStreamAcl'`, or an object of `readRoles`, `writeRoles`, `deleteRoles`, `metaReadRoles` and `metaWriteRoles`. Unknown ACL keys are dropped with a warning.

# Subscriptions

Subscriptions behave the same way on the gRPC and TCP clients.

- **Handlers:** `onEventAppeared` runs for one event at a time, in order. If it returns a promise, the next event waits for it.
- **Failures:** a handler that throws or rejects drops the subscription. `onDropped` is called once, and no further events reach the handler.
- **Live processing:** `onLiveProcessingStarted` fires once the handler has worked through the catch-up events.
- **Cleanup:** a dropped TCP subscription releases its own connection, and its `close()` is safe to call more than once. gRPC subscriptions share the client's connection, so there is nothing to release.

On gRPC, a subscription resolves once the server confirms it, so an event written straight after the `await` is delivered. A subscription the server refuses rejects rather than resolving, and `onDropped` only reports drops of subscriptions that started.

# Deleted events

When you read a stream or `$all` with `resolveLinkTos` enabled, some records are resolved-link events whose target has been deleted, tombstoned or scavenged. These are deleted events.

By default all clients now return deleted events instead of dropping them. A deleted event carries `isResolved: false`, with `data` and `metadata` set to `null`, and its stream and position fields taken from the link record. Returning them keeps batch reads at their true size, so paging stays correct. Previously the TCP client silently dropped them, which made a full batch of deleted events look like the end of the stream.

Set `includeDeleted: false` in the client config to skip deleted events and return only live ones. This applies to the gRPC and TCP clients. The HTTP client always returns them. On a gRPC persistent subscription, the skipped deleted events are acked automatically, so they are never retried or parked.

```javascript
const event = events.find((e) => e.isResolved === false);
// event.data === null, event.metadata === null
```

# Persistent subscriptions

Available on the gRPC and HTTP clients. `getEvents` is HTTP only.

- assert(subscriptionName, streamName, options)
- getEvents(subscriptionName, streamName, count, embed)
- getSubscriptionInfo(subscriptionName, streamName)
- getStreamSubscriptionsInfo(streamName)
- getAllSubscriptionsInfo()
- remove(subscriptionName, streamName)

The `$all` variants are gRPC only and need KurrentDB 21.10 or later. `assertToAll` accepts an optional `filter` in its options to restrict the subscription to matching event types or stream prefixes.

- assertToAll(subscriptionName, options)
- getToAllSubscriptionInfo(subscriptionName)
- getToAllSubscriptionsInfo()
- removeToAll(subscriptionName)

`replayParkedMessages*` is gRPC only. It replays a subscription's parked messages, optionally stopping at a given position with `options.stopAt`.

- replayParkedMessagesToStream(subscriptionName, streamName, options)
- replayParkedMessagesToAll(subscriptionName, options)

`restartSubsystem` is available on the gRPC and HTTP clients. It restarts the server's persistent subscription subsystem.

- restartSubsystem()

# Projections

Available on the gRPC and HTTP clients. `config` is HTTP only, and `getInfo`'s `includeConfig` argument applies to HTTP only.

- start(projectionName)
- stop(projectionName)
- reset(projectionName)
- remove(projectionName, deleteCheckpointStream, deleteStateStream)
- config(projectionName)
- getState(projectionName, options)
- getResult(projectionName, options)
- getInfo(projectionName, includeConfig)
- assert(projectionName, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled, trackEmittedStreams)
- enableAll()
- disableAll()
- getAllProjectionsInfo()

`assert` treats `enabled` the same way on both clients. A new projection is created running unless `enabled` is `false`. An existing projection only starts or stops when you pass `enabled`, so an `assert` without it leaves a stopped projection stopped. `checkpointsEnabled` is accepted but ignored on both, because HTTP forces it on for continuous projections and gRPC supports continuous projections only.

`enableAll` and `disableAll` also differ. The HTTP client lists all non-transient projections, so one-time projections are included. The gRPC client lists continuous projections only, so one-time projections are skipped.

`restartSubsystem` is available on the gRPC and HTTP clients. It restarts the server's projection subsystem.

- restartSubsystem()

# Preferred methods: iterate over read

Each client exposes buffering read methods (`getEvents`, `getAllStreamEvents`, `readEventsForward`, `readEventsBackward`) and async iterator methods (`iterateEvents`, `iterateAllStreamEvents`, `iterateEventsByType`, and on gRPC also `iterateAllEvents`).

Prefer the `iterate*` methods. They stream events one at a time from the server, reducing the memory footprint. e.g `iterateAllEventsForward`

---

# gRPC Client

The gRPC client is the recommended transport for new work.

## Config

The protocol defaults to `kurrentdb+discover`, which lets the client discover cluster nodes. Set `useSslConnection` for a secure connection and `tlsCAFile` to point at a CA certificate when the server uses one. Set `includeDeleted: false` to skip deleted events (see [Deleted events](#deleted-events)).

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

Methods available on the gRPC client beyond the common set above. The `readAll*` and `iterateAll*` methods read across all streams using the server-wide `$all` stream.

The client multiplexes all calls and subscriptions over a single shared connection per config, so there is no connection pool. `close` disposes the client's connection and `closeAllConnections` disposes every connection the process has opened.

`readAll*` and `iterateAll*` default `resolveLinkTos` to `false`. `$all` already holds every event, so resolving links would return each event again, once per `$ce-`, `$et-` or `$streams` link. Pass `true` only when you want the link records resolved.

Revisions and positions stay BigInt on gRPC results, which still serialise with `JSON.stringify` as decimal strings. An event's `commitPosition` is non-enumerable, so a spread copy of the event leaves it out. Read it from the event itself, or use `position.commit`.

Persistent subscription `ack` and `nack` take the events `onEventAppeared` receives, and accept several at once.

- getStreamMetadata(streamName)
- multiStreamWrite(writes)
- multiStreamWriteCrossStreamConsistency(writes, checks)
- readAllEvents(startPosition, count, direction, resolveLinkTos, filter)
- readAllEventsForward(startPosition, count, resolveLinkTos, filter)
- readAllEventsBackward(startPosition, count, resolveLinkTos, filter)
- iterateAllEvents(startPosition, count, direction, resolveLinkTos, filter)
- iterateAllEventsForward(startPosition, count, resolveLinkTos, filter)
- iterateAllEventsBackward(startPosition, count, resolveLinkTos, filter)
- subscribeToStream(streamName, onEventAppeared, onDropped, resolveLinkTos)
- subscribeToStreamFrom(streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings)
- subscribeToAll(fromPosition, onEventAppeared, onLiveProcessingStarted, onDropped, settings)
- createPersistentSubscriptionToStream(streamName, groupName, settings)
- subscribeToPersistentSubscriptionToStream(streamName, groupName, onEventAppeared, onDropped, settings, duplexOptions)
- createPersistentSubscriptionToAll(groupName, settings)
- subscribeToPersistentSubscriptionToAll(groupName, onEventAppeared, onDropped, settings, duplexOptions)
- close()
- getConnection()
- closeAllConnections()

## Server-side filtering over $all

The `readAll*`, `iterateAll*`, and `subscribeToAll` methods accept an optional server-side `filter`. The server then only sends matching events, instead of the client reading every event and discarding non-matches. This is far cheaper over `$all` than filtering in your own code.

Build a filter with the helpers exported from the package. Filters match on either event type or stream name, by prefix or by regular expression.

```javascript
import KurrentDB, { eventTypeFilter, streamNameFilter, excludeSystemEvents } from '@metronomic/kurrentdb-client';

const client = new KurrentDB.GRPCClient(config);

// All OrderPlaced events across every stream, newest first
const { events } = await client.readAllEventsBackward(
  'end',
  100,
  false,
  eventTypeFilter({ prefixes: ['OrderPlaced'] })
);

// Live subscription to every event on streams starting with "order-", skipping catch-up history
await client.subscribeToAll('end', onEventAppeared, onLiveProcessingStarted, onDropped, {
  filter: streamNameFilter({ prefixes: ['order-'] })
});

// Exclude system events (those on $ streams)
await client.readAllEventsForward('start', 1000, false, excludeSystemEvents());
```

`subscribeToAll` is a catch-up subscription over `$all`. `fromPosition` is `'start'`, `'end'`, or a `{ commit, prepare }` position. `onLiveProcessingStarted` fires when the subscription catches up and switches to live events.

Servers older than 22, the 21.10 image among them, never send the caught-up notification. On those servers the client reads the `$all` head when you subscribe and reports live processing once it reaches it. A filtered subscription may never deliver that head event, so it relies on the server's checkpoints instead. Those usually arrive near the head, but a short catch-up can finish before the server sends one.

---

# HTTP Client

## Config

```javascript
const client = new KurrentDB.HTTPClient({
  hostname: 'localhost',
  port: 2113,
  timeout: 5000, // optional, milliseconds
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

`timeout` applies to every HTTP call, including the `projections`, `persistentSubscriptions` and `admin` calls. Leave it unset for no timeout.

## Admin methods (only issues commands)

Available on the HTTP client only.

- admin.scavenge()
- admin.shutdown()

## Additional HTTP methods

- ping()

---

# TCP Client

The TCP transport is supported on KurrentDB >= 24.6 on a licensed server through a plugin.

## Config

Set `includeDeleted: false` to skip deleted events (see [Deleted events](#deleted-events)).

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

- subscribeToStream(streamName, onEventAppeared, onDropped, resolveLinkTos)
- subscribeToStreamFrom(streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings)
- eventEnumerator(streamName, direction, resolveLinkTos)
- close()
- getPool()
- closeAllPools()

Each subscription holds its own pooled connection. `close()` closes the client's operations pool and all of its subscription pools, so open subscriptions drop and the process can exit.

## License

MIT
