# geteventstore-promise
A Node.js Event Store client implementation using promises

# Installation
At the command-line:
> npm install geteventstore-promise

In your Node.js application:
> var eventstore = require('geteventstore-promise');

# HTTP Client

# Supported Methods

## getEvents(streamName, startPosition, length, direction)

Returns events from a given stream.

##### streamName
The name of the stream (as in Event Store) to read from.

##### startPosition (optional)
If specified, the stream will be read starting at event number startPosition, otherwise *0*;

##### length (optional)
The number of events to be read, defaults to *1000*;

##### direction (optional)
The direction to the read the stream. Can be either 'forward' or 'backward'. Defaults to *'forward'*.

#### Example

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

client.getEvents('TestStream', 0, 1000, 'forward') // defaults for getEvents if not specified
.then(function(events){
    console.log('Events ', JSON.stringify(events));
});
```

---

## writeEvent(streamName, eventType, data, metaData, options)

Writes a single event of a specific type to a stream.

##### streamName
The name of the stream (as in Event Store) to read from.

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

var testStream = 'TestStream-' + uuid.v4();

client.writeEvent(testStream, 'TestEventType', { something: '123' }).then(function() {
    client.getEvents(testStream).then(function(events){
        console.log('Events ', JSON.stringify(events));
    });
});
```

---

## writeEvents(streamName, events, options)

Writes an array of Event Store ready events to a stream.

##### streamName
The name of the stream (as in Event Store) to read from.

##### events
The array of Event Store ready events to save.
You can call ```eventstore.eventFactory.NewEvent('TestType', {something: 123});``` to get an Event Store ready event.

##### options (optional)
Any options to be specified (as documented in GetEvent Store documentation). Default is simply *ExpectedVersion = -2*.

#### Example

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

var events = [eventstore.eventFactory.NewEvent('TestEventType', { something: '456'})];

var testStream = 'TestStream-' + uuid.v4();

client.writeEvents(testStream, events).then(function() {
    client.getEvents(testStream).then(function(events){
        console.log('Events ', JSON.stringify(events));
    });
});
```

---

## checkStreamExists(streamName)

Reads the state of a given Projection stream as a JSON object.

##### streamName
The name of the stream (as in Event Store) to check.

#### Example

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

var projectionStreamName = 'ExistingProjectionStreamName';

client.checkStreamExists(projectionStreamName).then(function(exists) {
    console.log('Exists ', exists);
});
```

---

# Projections

# Supported Methods

* start(projectionName)
* stop(projectionName)
* reset(projectionName)
* remove(projectionName)
* getState(projectionName)
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

#### Example

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

client.projections.getState('TestProjection').then(function(projectionState) {
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

client.admin.scavenge().then(function() {
    console.log('Scavenge command sent ');
});
```

---

## admin.shutdown()

Sends shutdown command to Event Store.

If the promise is fulfilled then the shutdown command has been sent, it does not guarantee that the shutdown will be successful. 

#### Example

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

client.admin.shutdown().then(function() {
    console.log('Shutdown command sent ');
});
```

---

# TCP Client

# Acknowledgements

Uses the `event-store-client` as authored by Carey Bishop

Github: [https://github.com/x-cubed/event-store-client](https://github.com/x-cubed/event-store-client)

# Common methods(same as HTTP, just use TCP configuration)

* getEvents(streamName, startPosition, length, direction)
* writeEvent(streamName, eventType, data, metaData, options)
* writeEvents(streamName, events, options)

# Supported Methods 

## getEventsByType(streamName, eventTypes, startPosition, length, direction)

Returns all events from a given stream.

##### streamName
The name of the stream (as in Event Store) to read from.

##### eventTypes
An array of event types to filter by.

##### startPosition (optional)
If specified, the stream will be read starting at event number startPosition, otherwise *0*;

##### length (optional)
The number of events to be read, defaults to *1000*;

##### direction (optional)
The direction to the read the stream. Can be either 'forward' or 'backward'. Defaults to *'forward'*.

#### Example

```javascript
var eventstore = require('geteventstore-promise');

var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

client.getEventsByType('TestStream', ['TestType']).then(function(events){
    console.log('Events ', JSON.stringify(events));
});
```

---

## getAllStreamEvents(streamName)

Returns all events from a given stream.

##### streamName
The name of the stream (as in Event Store) to read from.

#### Example

```javascript
var eventstore = require('geteventstore-promise');

var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

client.getAllStreamEvents('TestStream').then(function(events){
    console.log('Events ', JSON.stringify(events));
});
```

---

## eventEnumerator(streamName, direction)

Returns all events from a given stream.

##### streamName
The name of the stream (as in Event Store) to read from.

##### direction (optional)
The direction to the read the stream. Can be either 'forward' or 'backward'. Defaults to *'forward'*.

## Supported Functions

* next(batchSize)
* previous(batchSize)
* first(batchSize)
* last(batchSize)

##### batchSize
The number of events to read per enumeration.

#### Example

```javascript
var eventstore = require('geteventstore-promise');

var client = eventstore.tcp({
                tcp: {
                    hostname: 'localhost',
                    protocol: 'tcp',
                    port: 1113,
                    credentials: {
                        username: 'admin',
                        password: 'changeit'
                    }
                }
            });

var streamName = 'TestStream';
var enumerator = client.eventEnumerator(streamName);

enumerator.next(20).then(function(result) {
    //Result
    // {
    //     isEndOfStream: true/false,
    //     events: [ ..., ..., ... ]
    // }

    console.log('Result ' , result);
});

```

---