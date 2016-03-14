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