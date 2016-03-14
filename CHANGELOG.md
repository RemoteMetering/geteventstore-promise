# 2.0.0 (2016-03-14)

## Breaking Changes

#### Configuration

- Remove `http` and `tcp` configuration properties
- Change `http` configuration to use `auth` instead of `credentials`

##### Previous `http` Usage
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

##### New `http` Usage
```javascript
var eventstore = require('geteventstore-promise');

var client = eventstore.http({
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                auth: 'admin:changeit'
            });

```