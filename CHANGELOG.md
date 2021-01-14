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

- Feature - Implemented connection pooling(defaulting to 1 connection) using [https://github.com/coopernurse/node-pool](https://github.com/coopernurse/node-pool), please see config in library and pass config as "poolOptions" when initing TCP client.<br/> Example: ` {  ...,  poolOptions: { min: 1, max: 10 } } `

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
				http:{
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
