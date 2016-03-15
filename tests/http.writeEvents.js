var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client - Write Events', function() {
    it('Write to a new stream and read the events', function() {
        var client = eventstore.http(httpConfig);

        var events = [eventstore.eventFactory.NewEvent('TestEventType', {
            something: '456'
        })];

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getEvents(testStream).then(function(events) {
                assert.equal(events[0].data.something, '456');
            });
        })
    });
});