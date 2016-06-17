var tcpConfig = require('./support/tcpConfig');
var eventstore = require('../index.js');
var assert = require('assert');
var uuid = require('node-uuid');

describe('TCP Client - Stress Tests', function() {
    it('Should write and read back 100000 stream events', function() {
        this.timeout(30 * 1000);

        var client = eventstore.tcp(tcpConfig);

        var events = [];
        for (var k = 0; k < 100000; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getAllStreamEvents(testStream).then(function(events) {
                assert.equal(events.length, 100000);
                assert.equal(events[0].data.id, 0);
                assert.equal(events[99999].data.id, 99999);
            });
        });
    });

    it('Should write and read back 100000 stream events with max chunk size', function() {
        this.timeout(30 * 1000);

        var client = eventstore.tcp(tcpConfig);

        var events = [];
        for (var k = 0; k < 100000; k++) {
            events.push(eventstore.eventFactory.NewEvent('TestEventType', {
                id: k
            }));
        }

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getAllStreamEvents(testStream, 4096).then(function(events) {
                assert.equal(events.length, 100000);
                assert.equal(events[0].data.id, 0);
                assert.equal(events[99999].data.id, 99999);
            });
        });
    });
});