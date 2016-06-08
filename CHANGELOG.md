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
