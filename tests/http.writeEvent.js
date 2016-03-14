var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client - Write Event', function() {
    it('Write to a new stream and read the event', function() {
        var client = eventstore.http({
            hostname: 'localhost',
            protocol: 'http',
            port: 2113,
            auth: 'admin:changeit'
        });

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvent(testStream, 'TestEventType', {
            something: '123'
        }).then(function() {
            return client.getEvents(testStream).then(function(events) {
                assert.equal(events[0].data.something, '123');
            });
        });
    });
});