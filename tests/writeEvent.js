var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client', function() {
    describe('Writing and Read an event', function() {
        it('Write to a new stream and read the event', function(done) {
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
            client.writeEvent(testStream, 'TestEventType', { something: '123' })
            .then(function() {
                client.getEvents(testStream)
                .then(function(events){
                    assert.equal(events[0].data.something, '123');
                	done();
                });
            })
            .catch(function(err) {
            	throw err;
            });
        });
    });
});