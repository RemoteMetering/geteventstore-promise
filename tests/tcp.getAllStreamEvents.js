var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('TCP Client - Get All Stream Events', function() {
    it('Should write events and read back all stream events', function() {
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

        var events = [];
        for (var k = 0; k < 1000; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getAllStreamEvents(testStream).then(function(events) {
                assert.equal(events.length, 1000);
                assert.equal(events[0].data.id, 0);
                assert.equal(events[999].data.id, 999)
            });
        });
    });
});