# geteventstore-promise
A GetEventStore client using promises

# Supported Methods

## getEvents(streamName, startPosition, length, direction)

Returns events from a given stream.

##### streamName
The name of the stream (as in EventStore) to read from.

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
.then(function(evs){
	console.log('EVS : ', JSON.stringify(evs));
});
```

---

## writeEvent(streamName, eventType, data, metaData, options)

Writes a single event of a specific type to a stream.

##### streamName
The name of the stream (as in EventStore) to read from.

##### eventType
The type of event to save. Any string value is accepted.

##### data
The data to be contained in the event as a JSON object.

##### metaData (optional)
Any MetaData to be saved in the event as a JSON object.

##### options (optional)
Any options to be specified (as documented in GetEventStore documentation). Default is simply *ExpectedVersion = -2*.

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

return client.writeEvent(testStream, 'TestEventType', { something: '123' })
	.then(function() {
		return client.getEvents(testStream)
		.then(function(events){
			assert.equal(events[0].data.something, '123');
		});
	});
```

---

## writeEvents(streamName, events, options)

Writes an array of EventStore ready events to a stream.

##### streamName
The name of the stream (as in EventStore) to read from.

##### events
The array of EventStore ready events to save.
You can call ```eventstore.eventFactory.NewEvent('TestType', {something: 123});``` to get an EventStore ready event.

##### options (optional)
Any options to be specified (as documented in GetEventStore documentation). Default is simply *ExpectedVersion = -2*.

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

return client.writeEvents(testStream, events)
	.then(function() {
		return client.getEvents(testStream)
			.then(function(events){
				assert.equal(events[0].data.something, '456');
			});
	});
```

---

## getProjectionState(streamName)

Reads the state of a given Projection stream as a JSON object.

##### streamName
The name of the stream (as in EventStore) to read from.

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

return client.getProjectionState(projectionStreamName)
	.then(function(state) {
		console.log('State ', JSON.stringify(state));
	});
```


