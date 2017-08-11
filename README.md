# geteventstore-promise
A Node.js Event Store client API wrapper using promises

[![NPM](https://nodei.co/npm/geteventstore-promise.png?stars&downloads&downloadRank)](https://nodei.co/npm/geteventstore-promise/) [![NPM](https://nodei.co/npm-dl/geteventstore-promise.png?months=3&height=3)](https://nodei.co/npm/geteventstore-promise/)

# Installation
At the command-line:
> npm install geteventstore-promise

In your Node.js application:
> const eventstore = require('geteventstore-promise');

# HTTP Client

# Supported Methods

## getEvents(streamName, startPosition, length, direction, resolveLinkTos, embed)

Returns events from a given stream.

##### streamName
The name of the stream to read from.

##### startPosition (optional)
If specified, the stream will be read starting at event number startPosition, otherwise *0*
'head' will start reading from the back of the stream, if direction is specified as 'backward'

##### length (optional)
The number of events to be read, defaults to *1000*, max of *4096*

##### direction (optional)
The direction to the read the stream. Can be either 'forward' or 'backward'. Defaults to *'forward'*.

##### resolveLinkTos (optional)
Resolve linked events. Defaults to *true*

##### embed (optional)
Resolve linked events. Options: 'body' and 'rich'. Defaults to *body*

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

// defaults for getEvents if not specified
client.getEvents('TestStream', 0, 1000, 'forward').then(events => {
    console.log('Events ', JSON.stringify(events));
});
```

---

## getAllStreamEvents(streamName, chunkSize, startPosition, resolveLinkTos, embed)

Returns all events from a given stream.

##### streamName
The name of the stream to read from.

##### chunkSize (optional)
The amount of events to read in each call to Event Store, defaults to *1000*, 

##### startPosition (optional)
If specified, the stream will be read starting at event number startPosition, otherwise *0*

##### resolveLinkTos (optional)
Resolve linked events. Defaults to *true*

##### embed (optional)
Resolve linked events. Options: 'body' and 'rich'. Defaults to *body*

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

client.getAllStreamEvents('TestStream').then(events => {
    console.log('Events ', JSON.stringify(events));
});
```

## writeEvent(streamName, eventType, data, metaData, options)

Writes a single event of a specific type to a stream.

##### streamName
The name of the stream to read from.

##### eventType
The type of event to save. Any string value is accepted.

##### data
The data to be contained in the event as a JSON object.

##### metaData (optional)
Any MetaData to be saved in the event as a JSON object.

##### options (optional)
Any options to be specified (as documented in GetEvent Store documentation). Default is simply *ExpectedVersion = -2*.

#### Example

```javascript
const eventstore = require('geteventstore-promise');
const uuid = require('uuid');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

let testStream = 'TestStream-' + uuid.v4();

client.writeEvent(testStream, 'TestEventType', { something: '123' }).then(() => {
    return client.getEvents(testStream).then(events => {
        console.log('Events ', JSON.stringify(events));
    });
});
```

---

## writeEvents(streamName, events, options)

Writes an array of Event Store ready events to a stream.

##### streamName
The name of the stream to read from.

##### events
The array of Event Store ready events to save.
You can call ```eventstore.eventFactory.NewEvent('TestType', {something: 123});``` to get an Event Store ready event.

##### options (optional)
Any options to be specified (as documented in GetEvent Store documentation). Default is simply *ExpectedVersion = -2*.

#### Example

```javascript
const eventstore = require('geteventstore-promise');
const uuid = require('uuid');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

let events = [eventstore.eventFactory.NewEvent('TestEventType', { something: '456'})];

let testStream = 'TestStream-' + uuid.v4();

client.writeEvents(testStream, events).then(() => {
    return client.getEvents(testStream).then(events => {
        console.log('Events ', JSON.stringify(events));
    });
});
```

---

## checkStreamExists(streamName)

Check if a stream exists, returns true or false.

##### streamName
The name of the stream to check.

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

let projectionStreamName = 'ExistingProjectionStreamName';

client.checkStreamExists(projectionStreamName).then(exists =>  {
    console.log('Exists ', exists);
});
```

---

## deleteStream(streamName, hardDelete)

Deletes a stream, fails the promise if stream does not exist.

##### streamName
The name of the stream to delete.

##### hardDelete
Hard delete the stream, defaults to false

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

let streamName = 'ExistingStreamName';

client.delete(streamName).then(() => {
    console.log('Stream deleted');
}).catch(err => {
    // should only happen if something went wrong OR the stream does not exist
    console.log(err);
});
```
---

## ping()

Performs Ping command, rejects promise if unsuccessful

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

client.ping().then(() => {
    console.log('EventStore is OK');
}).catch(err => {
    // should only happen if something went wrong
    console.log(err);
});
```
---

# Persistent Subscriptions

# Supported Methods

* assert(subscriptionName, streamName, options)
* getEvents(subscriptionName, streamName, count, embed)
* getSubscriptionInfo(subscriptionName, streamName)
* getStreamSubsciptionsInfo(streamName)
* getAllSubsciptionsInfo()
* remove(subscriptionName, streamName)

## persistentSubscriptions.assert(subscriptionName, streamName, options)
Upsert the persistent subscription

#### subscriptionName
The name of the subscription group

#### streamName
The stream name

#### options(optional)
The mode of the projection to create, defaults to 'continous'

##### resolveLinktos
Tells the subscription to resolve link events.

##### startFrom
Start the subscription from the position-th event in the stream.

##### extraStatistics
Tells the backend to measure timings on the clients so statistics will contain histograms of them.

##### checkPointAfterMilliseconds
The amount of time the system should try to checkpoint after.

##### liveBufferSize
The size of the live buffer (in memory) before resorting to paging.

##### readBatchSize  
The size of the read batch when in paging mode.

##### bufferSize
The number of messages that should be buffered when in paging mode.

##### maxCheckPointCount
The maximum number of messages not checkpointed before forcing a checkpoint.

##### maxRetryCount
Sets the number of times a message should be retried before being considered a bad message.

##### maxSubscriberCount
Sets the maximum number of allowed subscribers

##### messageTimeoutMilliseconds
Sets the timeout for a client before the message will be retried.

##### minCheckPointCount
The minimum number of messages to write a checkpoint for.

##### namedConsumerStrategy
RoundRobin/DispatchToSingle/Pinned

## persistentSubscriptions.getEvents(subscriptionName, streamName, count, embed)
Get events

#### subscriptionName
The name of the subscription group

#### streamName
The stream name

#### count (optional)
Number of events to return(defaults to 1)

#### embed (optional)
None, Content, Rich, Body, PrettyBody, TryHarder(defaults to 'Body')

## persistentSubscriptions.getSubscriptionInfo(subscriptionName, streamName)
Get specific subscriptions info

#### subscriptionName
The name of the subscription group

#### streamName
The stream name

## persistentSubscriptions.getStreamSubscriptionsInfo(streamName)
Get all subscriptions info for a stream

#### streamName
The stream name

## persistentSubscriptions.getAllSubscriptionsInfo()
Get all subscriptions info

---

# Projections

# Supported Methods

* start(projectionName)
* stop(projectionName)
* reset(projectionName)
* remove(projectionName)
* getState(projectionName, options)
* getInfo(projectionName)
* enableAll()
* disableAll()
* getAllProjectionsInfo()
* assert(projectionName, projectionContent, mode, enabled, checkpointsEnabled, emitEnabled)
    #### projectionName
    The name of the projection

    #### projectionContent
    The content of the projection

    #### mode(optional)
    The mode of the projection to create, defaults to 'continous'

    #### enabled(optional)
    Projection enabled by default, defaults to true

    #### checkpointsEnabled(optional)
    Should enable checkpoints, defaults to true for continous projections and false for onetime projections

    #### emitEnabled(optional)
    Should enable emitting, defaults to false


## Example for using any projection method

## projections.getState()

Returns the state of the Projection as a JSON object.

##### projectionName
The name of the projection to get state of.

##### options(optional)
    ##### partition
    The name of the partition to retrieve.

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });


client.projections.getState('TestProjection').then(projectionState =>  {
    console.log('Projection State ', JSON.stringify(projectionState));
});
```

---

# Admin

## admin.scavenge()

Sends scavenge command to Event Store.

If the promise is fulfilled then the scavenge command has been sent, it does not guarantee that the scavenge will be successful. 

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

client.admin.scavenge().then(() => {
    console.log('Scavenge command sent ');
});
```

---

## admin.shutdown()

Sends shutdown command to Event Store.

If the promise is fulfilled then the shutdown command has been sent, it does not guarantee that the shutdown will be successful. 

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.http({
                hostname: 'localhost',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

client.admin.shutdown().then(() => {
    console.log('Shutdown command sent ');
});
```

---

# TCP Client

# Acknowledgements

Uses the `event-store-client` as authored by Carey Bishop

Github: [https://github.com/x-cubed/event-store-client](https://github.com/x-cubed/event-store-client)

Uses the `node-eventstore-client` as authored by nicdex

Github: [https://github.com/nicdex/node-eventstore-client](https://github.com/nicdex/node-eventstore-client)

# Common methods(same as HTTP, just use TCP configuration)

* getEvents(streamName, startPosition, length, direction, resolveLinkTos)
* writeEvent(streamName, eventType, data, metaData, options)
* writeEvents(streamName, events, options)
* deleteStream(streamName, hardDelete)

# Supported Methods 

## closeConnections()
Closes all active connections.

## closeConnections()
Returns all active connections.

## getEventsByType(streamName, eventTypes, startPosition, length, direction, resolveLinkTos)

Returns all events from a given stream by Event Types.

##### streamName
The name of the stream to read from.

##### eventTypes
An array of event types to filter by.

##### startPosition (optional)
If specified, the stream will be read starting at event number startPosition, otherwise *0*

##### length (optional)
The number of events to be read, defaults to *1000*, max of *4096*

##### direction (optional)
The direction to the read the stream. Can be either 'forward' or 'backward'. Defaults to *'forward'*.

##### resolveLinkTos (optional)
Resolve linked events. Defaults to *true*

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.tcp({
                hostname: 'localhost',
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

client.getEventsByType('TestStream', ['TestType']).then(events => {
    console.log('Events ', JSON.stringify(events));
});
```

---

## getAllStreamEvents(streamName, chunkSize, startPosition, resolveLinkTos)

Returns all events from a given stream.

##### streamName
The name of the stream to read from.

##### chunkSize (optional)
The amount of events to read in each call to Event Store, defaults to *1000*, 

##### startPosition (optional)
If specified, the stream will be read starting at event number startPosition, otherwise *0*

##### resolveLinkTos (optional)
Resolve linked events. Defaults to *true*

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.tcp({
                hostname: 'localhost',
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

client.getAllStreamEvents('TestStream').then(events => {
    console.log('Events ', JSON.stringify(events));
});
```

---

## SubscribeToStream(streamName, onEventAppeared, onConfirm, onDropped, resolveLinkTos)

Subscribes to a Stream (live subscription)

##### streamName
The name of the stream to read from.

##### onEventAppeared (optional)
function

##### onConfirm
function

##### onDropped
function

##### resolveLinkTos
Resolve linked events

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.tcp({
                hostname: 'localhost',
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

        function onEventAppeared(ev) {
            processedEventCount++;
            return;
        };

        function onConfirm() {
            return;
        }

        function onDropped(reason) {
            done('should not drop');
        };

client.SubscribeToStream('TestStream', onEventAppeared, onConfirm, onDropped, false);
```

---

## SubscribeToStreamFrom(streamName, fromEventNumber, onEventAppeared, onLiveProcessingStarted, onDropped, settings)

Subscribes to a Stream from a given event number (Catch up Subscription)

##### streamName
The name of the stream to read from.

##### fromEventNumber
The event number to subribe from

##### onEventAppeared (optional)
function

##### onLiveProcessingStarted
function

##### onDropped
function

##### settings
resolveLinkTos - Whether or not to resolve link events 

maxLiveQueueSize - The max amount to buffer when processing from live subscription

readBatchSize - The number of events to read per batch when reading history

debug - in debug mode(true/false)

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.tcp({
                hostname: 'localhost',
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

let processedEventCount = 0;

function onEventAppeared(ev) {
    processedEventCount++;
    return;
};

function onLiveProcessingStarted() {
    return;
}

function onDropped(reason) {
    done('should not drop');
};

client.SubscribeToStreamFrom('TestStream', 0, onEventAppeared, onLiveProcessingStarted,onDropped);
```

---

## eventEnumerator(streamName, direction, resolveLinkTos)

Returns an events enumerator on which events can be iterated.

##### streamName
The name of the stream to read from.

##### direction (optional)
The direction to the read the stream. Can be either 'forward' or 'backward'. Defaults to *'forward'*.

##### resolveLinkTos (optional)
Resolve linked events. Defaults to *true*

## Supported Functions

* next(batchSize)
* previous(batchSize)
* first(batchSize)
* last(batchSize)

##### batchSize
The number of events to read per enumeration.

#### Example

```javascript
const eventstore = require('geteventstore-promise');

let client = eventstore.tcp({
                hostname: 'localhost',
                port: 1113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            });

let streamName = 'TestStream';
let enumerator = client.eventEnumerator(streamName);

enumerator.next(20).then(result =>  {
    //Result
    // {
    //     isEndOfStream: true/false,
    //     events: [ ..., ..., ... ]
    // }
});

```

---
