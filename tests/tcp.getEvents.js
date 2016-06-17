var tcpConfig = require('./support/tcpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('TCP Client - Get Events', function() {

    var testStream = 'TestStream-' + uuid.v4();
    var numberOfEvents = 10;

    before(function() {
        var client = eventstore.tcp(tcpConfig);

        var events = [];

        for (var i = 1; i <= numberOfEvents; i++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                something: i
            }))
        };

        return client.writeEvents(testStream, events).then(function() {
            console.log('Written Events');
        });
    });

    it('Should get events reading forward', function() {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, undefined, undefined, 'forward').then(function(events) {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 1);
        });
    });

    it('Should get events reading backward', function() {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, undefined, undefined, 'backward').then(function(events) {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 10);
        });
    });

    it('Should get events reading backward from a start position', function() {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, 2, undefined, 'backward').then(function(events) {
            assert.equal(events.length, 3);
            assert.equal(events[0].data.something, 3);
        });
    });

    it('Should get events reading backward with a length greater than the stream length', function() {
        var client = eventstore.tcp(tcpConfig);

        return client.getEvents(testStream, undefined, 10000, 'backward').then(function(events) {
            assert.equal(events.length, 10);
            assert.equal(events[0].data.something, 10);
        });
    });
});