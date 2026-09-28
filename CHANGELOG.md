# 5.0.8 (2026-09-28)

#### Features

- Added a gRPC client backed by `@kurrent/kurrentdb-client`
- Added `iterate*` async iterator read methods across all clients: `iterateEvents`, `iterateEventsForward`, `iterateEventsBackward`, `iterateAllStreamEvents`, and `iterateEventsByType`. The gRPC client also adds `iterateAllEvents`, `iterateAllEventsForward`, and `iterateAllEventsBackward`
- These `iterate*` methods stream events one at a time, reducing memory footprint. They are now the preferred way to read over the buffering `getEvents`, `getAllStreamEvents`, `readEventsForward`, and `readEventsBackward` methods
- Added `setStreamMetadata` across all clients to write stream metadata such as `maxAge`, `maxCount`, `truncateBefore`, `cacheControl`, and ACLs, plus custom properties. The HTTP and TCP clients translate the friendly metadata shape to the raw system metadata document. All three clients validate it the same way. The system values must be integers, the ACL must be a string or an object of roles, and unknown ACL keys are dropped with a warning
- Added `projections.restartSubsystem` and `persistentSubscriptions.restartSubsystem` on the gRPC and HTTP clients to restart the server's projection and persistent subscription subsystems
- Added `persistentSubscriptions.replayParkedMessagesToStream` and `persistentSubscriptions.replayParkedMessagesToAll` on the gRPC client to replay a subscription's parked messages, with an optional `stopAt` limit
- `expectedVersion` accepts the same values on every client: a revision as a Number, BigInt or decimal string, `-2` or `'any'`, `-1` or `'no_stream'`, and `-4` or `'stream_exists'`
- `getEventsByType` and `iterateEventsByType` accept a single event type as a string as well as an array

#### Breaking changes

- Renamed package to `@metronomic/kurrentdb-client`
- Package is now pure ESM
- Node 20 or later is now required
- Deleted events are now returned instead of being silently dropped. Reads, iterators and subscriptions on the TCP client previously skipped resolved-link events whose target had been deleted, tombstoned or scavenged. This hid the true batch size and made a full batch of deleted events look like the end of a stream. Deleted events are now returned with `isResolved: false` and `data`/`metadata` set to `null`. Set `includeDeleted: false` in the client config to restore the old skipping behaviour. The HTTP client already returned these records and is unchanged, as will the new gRPC client
- An invalid `expectedVersion` now throws `Invalid expectedVersion` on HTTP and TCP. It used to fall back to Any, which silently dropped the concurrency check. This covers values such as `'WRONG'`, fractions and unused negatives
- An invalid start position now throws instead of reading from the start. This covers HTTP `iterateAllStreamEvents` and every gRPC read and subscription
- TCP `positionCreated` is now an ISO string like `created`, matching the gRPC client and the types. It used to be a `Date`
- HTTP `projections.assert` now honours `enabled`. A new projection is created stopped when `enabled` is `false`. An existing projection only starts or stops when `enabled` is passed, so an `assert` without it no longer restarts a projection that was stopped on purpose. The gRPC client follows the same rules
- TCP `close()` now closes the client's subscription pools as well as its operations pool, so open subscriptions drop and the process can exit
- A TCP subscription whose handler throws or rejects is now dropped with `eventHandlerException`. A volatile `subscribeToStream` used to log the failure and keep running. A catch-up subscription drops with `catchUpError` when the failure happens while reading history
- A dropped TCP subscription now releases its connection and pool itself, so it cannot be used again after `onDropped` fires

#### Changes

- Changed the default connection pool size to 5 for TCP

## gRPC

#### Features

- Stream operations, `$all` reads, and stream metadata
- A single multiplexed connection per config. `close` disposes the client's connection, `getConnection` returns it, and `closeAllConnections` disposes every connection the process has opened. A client whose creation fails is retried on the next call rather than cached
- `subscribeToStreamFrom` supports the `onLiveProcessingStarted` callback, fired when the subscription catches up and switches to live events
- `subscribeToAll`, a catch-up subscription over `$all`, with `onLiveProcessingStarted` support
- Server-side filtering over `$all` by event type or stream prefix. The `readAll*`, `iterateAll*`, and `subscribeToAll` methods accept an optional `filter`, so the server sends only matching events instead of the client reading and discarding. Build filters with the exported `eventTypeFilter`, `streamNameFilter`, and `excludeSystemEvents` helpers
- `multiStreamWrite` to append events to multiple streams in a single atomic transaction, with a per stream `expectedVersion`
- `multiStreamWriteCrossStreamConsistency` to append event records to one or more streams in a single atomic transaction, with optional cross-stream consistency checks
- Persistent subscriptions
- Persistent subscriptions to `$all`, with optional server-side filtering by event type or stream prefix. Adds `createPersistentSubscriptionToAll` and `subscribeToPersistentSubscriptionToAll`, plus `assertToAll`, `removeToAll`, `getToAllSubscriptionInfo`, and `getToAllSubscriptionsInfo` on `persistentSubscriptions`. Needs KurrentDB 21.10 or later
- Projections

#### Behaviour

The gRPC client matches the HTTP and TCP clients rather than passing the underlying client's shapes
straight through.

- `readEventsForward` and `readEventsBackward` return `isEndOfStream`, `readDirection`, `fromEventNumber` and `nextEventNumber` alongside `events`, as the HTTP and TCP clients do. gRPC reports no head-of-stream flag, so `isEndOfStream` is derived from a batch coming back shorter than the requested count, or from a backward read reaching event 0. The count is taken before `includeDeleted` filtering so the metadata still describes what the server returned. `readAllEventsForward` and `readAllEventsBackward` still return `events` only, because a revision based `nextEventNumber` has no meaning against `$all`, where positions are commit and prepare pairs
- Start positions read the way TCP reads them. A missing position means the start, or the end on a backward read, and `-1` means the end. A revision may be a Number, BigInt or decimal string, and stays exact above 2^53. `subscribeToStreamFrom` treats `0` and `-1` as the start
- Results serialise with `JSON.stringify`. BigInt revisions and positions keep their type but serialise as decimal strings. `commitPosition` is present on every event the server supplies it for, including ordinary `$all` events, and is non-enumerable so a spread copy of an event does not carry a BigInt
- `readAll*` and `iterateAll*` default `resolveLinkTos` to `false`, like `subscribeToAll`. `$all` already holds every event, so resolving links would return each event again once per `$ce-`, `$et-` or `$streams` link
- `subscribeToStream` is live only. It starts at the end of the stream, as TCP does, and does not replay history
- Subscriptions resolve once the server confirms them, so an event written straight after the `await` is delivered. A subscription the server refuses rejects, and `onDropped` only reports drops of confirmed subscriptions
- Subscription handlers run one at a time and in order, and an async handler is awaited before the next event. A handler that throws or rejects, or an event that cannot be mapped, drops the subscription once through `onDropped`
- `onLiveProcessingStarted` fires only after the handler has worked through the catch-up events. It also fires on servers older than 22, such as 21.10, which never send the caught-up notification. There it falls back to the stream or `$all` head read at subscribe time
- Persistent subscription `ack` and `nack` take the mapped events, several at once, and acknowledge a resolved link by its link id. Deleted-event markers filtered out by `includeDeleted: false` are acked automatically so they are never parked
- `positionCausedBy` and `positionCorrelationId` come from the link metadata
- `projections.getInfo` fetches one projection by name. `projections.assert` follows the HTTP `enabled` rules
- Omitting `useSslConnection` means an unencrypted connection, rather than an invalid connection string
- A single `hostname` uses discovery by default, which connects to the address the node advertises. Behind a load balancer, a port-forward or a Docker-mapped port, pass `protocol: 'kurrentdb'` to connect directly

# 4.0.1 (2021-09-28)

## TCP

- Fix - handle closed connection when `closed` event never emitted

#### Dependencies

- Update packages

# 4.0.0 (2021-05-22)

#### Features

- Added support for `v20` and `v21`
- Added support for secured EventStoreDB clusters and single instances

#### Breaking Changes

- Removed deprecated legacy instance creation: `geteventstore.tcp(config)`, `geteventstore.http(config)` and `geteventstore.eventFactory`

## TCP

##### Features

- Added `connectionNameGenerator` function to config that allows custom TCP connection names

## Tests

- Tests now solely uses docker
- Added `test:secure` and `test:insecure` scripts
- `test` will now run all tests with secured and insecure EventStoreDB's

# 3.3.0 (2021-02-22)

## TCP

#### Changes

- Destroy connection on connection close
- Subscription connection pools now tracked uniquely
- `close` connection pool will now drain pool first

#### Fixes

- `subscribeToStream` - `close` will now release and close subscription connection pool
- `subscribeToStreamFrom` - added `close` function that will release and close subscription connection pool

#### Dependencies

- Update packages

# 3.2.5 (2021-01-29)

#### Dependencies

- Update packages

# 3.2.4 (2020-11-04)

#### Fix

- projections - `assert`, `trackEmittedStreams` setter. Thanks [@maniolias](https://github.com/maniolias)

# 3.2.3 (2020-10-20)

- projections - `config` query added. Thanks [@maniolias](https://github.com/maniolias)
- projections - `getInfo`, `includeConfig` in result set added. Thanks [@maniolias](https://github.com/maniolias)
- projections - `assert`, `trackEmittedStreams` added. Thanks [@maniolias](https://github.com/maniolias)

# 3.2.2 (2020-10-05)

#### Fix

- persistentSubscriptions.assert - `resolveLinkTos` not applying due to typo. Thanks [@maniolias](https://github.com/maniolias)
- persistentSubscriptions.getEvents - 401 due to missing auth headers. Thanks [@maniolias](https://github.com/maniolias)

#### Dependencies

- Update packages

# 3.2.1 (2020-02-27)

#### Dependencies

- Update packages

# 3.2.0 (2019-10-07)

#### Breaking Changes

- subscriptions - onEventAppeared aligned with `node-eventstore-client`, previously: `onEventAppeared(ev)` now: `onEventAppeared(subscription, ev)`. Thanks [@adebisi-fa](https://github.com/adebisi-fa)

#### Features

- projections - `result` query added. Thanks [@set4812](https://github.com/set4812)

# 3.1.3 (2019-09-09)

#### Fix

- Typings - Metadata and eventId is optional. Thanks [@spontoreau](https://github.com/spontoreau)

#### Dependencies

- Update packages

# 3.1.2 (2019-07-29)

#### Misc

- Typings - Inherit base TCP config from 'node-eventstore-client'. Thanks [@adebisi-fa](https://github.com/adebisi-fa)

#### Dependencies

- Update packages

# 3.1.1 (2019-02-14)

#### Fix

- TCPReadResult typescript definition

# 3.1.0 (2019-02-07)

#### Features

- Add readEventsForward and readEventsBackward returning read metadata + events

#### Misc

- Rename "length" parameter to "count"

# 3.0.3 (2019-02-06)

#### TCP Client

- Fix - mapping of non-json events

# 3.0.2 (2019-01-02)

#### Fix

- Expected version on writes defaulting to -2 when 0 provided. Thanks [@amaghfur](https://github.com/amaghfur)

#### Dependencies

- Update packages

#### Misc

- Change folder structure

# 3.0.1 (2018-09-17)

#### Misc

- Fix - General Typescript definition issues

# 3.0.0 (2018-09-13)

#### Features

- Typescript definitions added
- Package exports now exposed as classes

  ##### Previous Usage (Deprecated)

  ```javascript
  const eventstore = require('geteventstore-promise');
  const httpClient = eventstore.http(...config);
  const tcpClient = eventstore.tcp(...config);
  const newEvent = eventstore.eventFactory.NewEvent(...args);
  ```

  ##### New Usage

  ```javascript
  const EventStore = require('geteventstore-promise');
  const httpClient = new EventStore.HTTPClient(...config);
  const tcpClient = new EventStore.TCPClient(...config);
  const newEvent = new EventStore.EventFactory().newEvent(...args);
  ```

#### Dependencies

- Remove - bluebird
- Remove - lodash
- Replace - request-promise with axios

#### Breaking Changes

##### General

- Promises - '.finally()' will not be available anymore due to the removal of bluebird

##### HTTP Client

- Errors returned from HTTP calls might differ slightly from removed request-promise package vs the new axios implementation

# 2.0.2 (2018-09-11)

#### TCP Client

- Feature - Add support for connecting to a cluster using gossip seeds or dns discovery (https://github.com/RemoteMetering/geteventstore-promise#config-example)

#### Misc

- Update dependencies

# 2.0.1 (2018-06-04)

#### TCP Client

- Fix - edge case when eventNumber is not coming back as a long

# 2.0.0 (2018-06-02)

#### TCP Client

- Feature - Implemented connection pooling(defaulting to 1 connection) using [https://github.com/coopernurse/node-pool](https://github.com/coopernurse/node-pool), please see config in library and pass config as "poolOptions" when initing TCP client.<br/> Example: `{  ...,  poolOptions: { min: 1, max: 10 } }`

- Change - subscriptions now use [https://github.com/nicdex/node-eventstore-client](https://github.com/nicdex/node-eventstore-client) for subscriptions - Causes breaking changes

#### Breaking Changes

#### TCP Client

- Replacement - 'closeConnections' with 'close', which will close connection pool
- Subscriptions - now return subscription object from tcp library instead of connection
- Subscriptions - now return events in same format as normal getEvents
- Subscriptions - onDropped arguments -> onDropped(subscription, reason, error)
- subscribeToStream - no longer has "onConfirm" handler

# 1.4.0 (2018-05-29)

#### TCP Client

- "created" property on read events will now return as a ISO-8601 string instead of date object

#### Breaking Changes

- TCP: To bring both HTTP and TCP read events results inline, "created" will now return as a ISO-8601 string

# 1.3.3 (2018-05-29)

#### HTTP Client

- Add "created" property to events on read, as TCP client returns

#### Dependencies

- Use latest packages

# 1.3.2 (2018-04-24)

#### Dependencies

- Use latest packages

# 1.3.1 (2017-10-27)

#### HTTP Client

- Remove redundant url parsing logic, by setting base url on client create

# 1.3.0 (2017-10-27)

#### Dependencies

- Use latest packages
- TCP: upgrade node-eventstore-client from 0.1.7 to 0.1.9

#### Dev

- Requires nodejs >= v.7.6

#### Misc

- Convert library source to use es6 modules, and async/await
- Use babel latest preset

# 1.2.8 (2017-08-11)

#### TCP Client

- Improve tcp connection on error logging

# 1.2.7 (2017-08-11)

#### TCP Client

- Update to latest version of newly named node-eventstore-client from eventstore-node

# 1.2.6 (2017-07-26)

#### HTTP Client

- Feature: add embed option to getEvents and getAllStreamEvents. Options: 'body' and 'rich', defaults to 'body' as per previous versions

# 1.2.5 (2017-04-18)

#### TCP Client

- Fix: deleting of projected streams(Expected version to any)

# 1.2.4 (2017-04-18)

#### TCP Client

- Fix: add eventId and positionCreated properties to mapped events

# 1.2.3 (2017-04-18)

#### TCP Client

- Feature: add deleteStream

# 1.2.2 (2017-03-29)

#### TCP Client

- Fix: convert metadata in mapping

# 1.2.1 (2017-03-29)

#### TCP Client

- Fix: filter deleted events on projected streams

#### Breaking Changes

- TCP: events, rename property eventStreamId to streamId

# 1.2.0 (2017-03-29)

#### Source

- Convert to ES6

#### Misc.

- Fix: debug logs doing unnecessary stringify, increases performance all around

#### Breaking Changes

- None

# 1.1.26 (2017-03-27)

#### TCP Client

- Add check stream exits

# 1.1.25 (2017-03-27)

#### TCP Client

- Update to latest version of eventstore-node that inclues some fixes

# 1.1.25 (2017-03-22)

#### TCP Client

- Changed write+read backend to [https://github.com/nicdex/eventstore-node](https://github.com/nicdex/eventstore-node)
- New Feature: connection pooling so calls use single open connection
- New Feature: ablility to close connections and get connections

# 1.1.24 (2017-03-15)

#### HTTP Client

- New Feature: persistent subscriptions v1
- Fix: deleteStream, return error object on stream 404

# 1.1.23 (2017-03-15)

#### HTTP Client

- Fix checkStreamExists, return rejected promise on any error other than a 404

#### TCP Client

- Use latest event-store-client

#### EventFactory

- Added support for custom eventId(thanks @krazar)

#### Dependencies

- bluebird, 3.4.6 > 3.5.0
- debug, 2.2.0 > 2.6.3
- event-store-client, 0.0.10 > 0.0.11
- lodash, 4.15.0 > 4.17.4
- request-promise, 2.0.1 > 4.1.1 (requires request 2.81.0)
- uuid, 3.0.0 > 3.0.1

#### Misc

- added missing debug logs

# 1.1.22 (2017-03-09)

#### HTTP Client

- add timeout option

# 1.1.21 (2017-01-04)

#### All Clients

- add resolveLinkTos optional param for all read functions

# 1.1.20 (2016-12-22)

#### HTTP Client

- deleteStream, added option to hard delete streams(thanks @mjaric)

#### TCP Client

- SubscribeToStreamFrom, added missing event-store-client settings(maxLiveQueueSize, readBatchSize, debug)

# 1.1.19 (2016-12-08)

#### Dependencies

- 'q' promise library replaced by bluebird (3.4.6)

# 1.1.18 (2016-11-23)

#### Dependencies

- 'node-uuid' got deprecated and renamed to 'uuid'(3.0.0)

# 1.1.17 (2016-11-17)

#### TCP Client

- clean up console log on live subscription

# 1.1.16 (2016-11-10)

#### TCP Client

- Add Subcribe to stream to start a live subscription to a stream

# 1.1.15 (2016-09-22)

#### Aggregate Root

- Fix: version of aggregrate not setting on event 0

#### TCP Client

- Upgrade to lastest event-store-client library(0.0.10)

#### Misc.

- Update to latest lodash(4.15.0)

# 1.1.14 (2016-08-24)

#### HTTP Client

- Fix: GetEvents: When passing starting position of 0 for backward read, only event 0 should be returned. Was starting read over from the back of the stream(Potential breaking change)

# 1.1.13 (2016-07-26)

#### TCP Client

- Fix: Create local references of events when writing

# 1.1.12 (2016-07-26)

#### HTTP Client

- Fix: Only parse event data when defined
- Fix: Return full error object on getAllStreamEvents

#### TCP Client

- Fix: Return full errors
- Upgrade to lastest event-store-client library(0.0.9)

# 1.1.11 (2016-07-18)

#### TCP Client

- Upgrade to lastest event-store-client library(0.0.8)

# 1.1.10 (2016-06-28)

#### TCP Client

- Feature: subscribeToStreamFrom to allow resolveLinkTos setting

# 1.1.9 (2016-06-28)

#### TCP Client

- Feature: add subscribeToStreamFrom

#### HTTP Client

- Feature: get state of partitioned projection

#### Dependencies

- replace underscore with lodash
- upgrade version event-store-client 0.0.7

# 1.1.8 (2016-06-20)

#### HTTP Client

- Fix: writeEvents return successful if empty array given
- Fix: any get events function will default to 4096 count if greater is requested (warning also displayed)
- Feature: add getAllStreamEvents function

#### TCP Client

- Feature: added start event number on getAllStreamEvents
- Fix: any get events function will default to 4096 count if greater is requested (warning also displayed)
- Change: default chunkSize of reads from 250 to 1000

#### Tests

- Added tests to TCP and HTTP client to check for undefined, empty array in writeEvents

# 1.1.7 (2016-06-08)

#### HTTP Client

- Ping: returns successful if ping can be called, rejects if not

# 1.1.6 (2016-06-07)

#### HTTP Client

- DeleteStream: deletes an existing stream, rejects if the stream does not exist

# 1.1.5 (2016-06-07)

#### HTTP Client

- GetEvents return events in the correct order. Forwards and Backwards now return as expected. Reverse of what it used to be.

# 1.1.4 (2016-04-15)

#### TCP Client

- Return rejected promise on failure to connect to Event Store instead of just logging it

# 1.1.3 (2016-04-06)

#### HTTP Client

- Make checkStreamExists more accurate
- Fix request-promise usage to include 'embed=body' as query string object(mono fix)

# 1.1.2 (2016-04-04)

#### TCP Client

- Fix tcp client adding invalid 'host' property to config

# 1.1.1 (2016-03-15)

## Breaking Changes

#### HTTP client

- 'getProjectionState' moved to 'projections.getState'
- 'getAllProjectionsInfo' moved to 'projections.getAllProjectionsInfo'

# 1.1.0 (2016-03-14)

## Breaking Changes

#### Configuration

- Removed wrapping `http` and `tcp` configuration properties
- Removed protocol property, assigned internally

##### Previous Usage

```javascript
var eventstore = require('geteventstore-promise');

var client = eventstore.http({
  http: {
    hostname: 'localhost',
    protocol: 'http',
    port: 2113,
    credentials: {
      username: 'admin',
      password: 'changeit'
    }
  }
});
```

##### New Usage

```javascript
var eventstore = require('geteventstore-promise');

var client = eventstore.http({
  hostname: 'localhost',
  port: 2113,
  credentials: {
    username: 'admin',
    password: 'changeit'
  }
});
```
