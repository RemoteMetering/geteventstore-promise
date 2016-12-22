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
- Fix: any get events function will default to 4096 length if greater is requested (warning also displayed)
- Feature: add getAllStreamEvents function

#### TCP Client

- Feature: added start event number on getAllStreamEvents
- Fix: any get events function will default to 4096 length if greater is requested (warning also displayed)
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
