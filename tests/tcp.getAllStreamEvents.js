require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('uuid');

describe('TCP Client - Get All Stream Events', function() {
    xit('Should write events and read back all stream events', function() {
        var client = eventstore.tcp(tcpConfig);

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
                assert.equal(events[999].data.id, 999);
            });
        });
    });

    xit('Should write events and read back all events from start event', function() {
        var client = eventstore.tcp(tcpConfig);

        var events = [];
        for (var k = 0; k < 1000; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getAllStreamEvents(testStream, 250, 500).then(function(events) {
                assert.equal(events.length, 500);
                assert.equal(events[0].data.id, 500);
                assert.equal(events[499].data.id, 999);
            });
        });
    });

    it('TEST DEBUG INFLUENCE', function() {
        this.timeout(100 * 1000);
        var client = eventstore.tcp(tcpConfig);

        var events = [];
        for (var k = 0; k < 10000; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        console.time('TIME !!!');
        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getAllStreamEvents(testStream, 250, 500).then(function(events) {
                console.timeEnd('TIME !!!');
                assert.equal(events.length, 500);
                assert.equal(events[0].data.id, 500);
                assert.equal(events[499].data.id, 999);
            });
        });
    });
});