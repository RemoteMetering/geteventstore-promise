require('./_globalHooks');

var tcpConfig = require('./support/tcpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('uuid');

describe('TCP Client - Write Events', function() {
    it('Write to a new stream and read the events', function() {
        var client = eventstore.tcp(tcpConfig);

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

    it('Write to a new stream and read the events by type', function() {
        var client = eventstore.tcp(tcpConfig);

        var events = [eventstore.eventFactory.NewEvent('TestEventType', {
            something: '456'
        }), eventstore.eventFactory.NewEvent('ToBeIgnoredType', {
            something: '789'
        })];

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            return client.getEventsByType(testStream, ['TestEventType']).then(function(events) {
                assert.equal(events.length, 1);
                assert.equal(events[0].eventType, 'TestEventType');
                assert.equal(events[0].data.something, '456');
            });
        })
    });

     it('Should not fail promise if no events provided', function() {
        var client = eventstore.tcp(tcpConfig);

        var events =[];

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events);
    });

     it('Should fail promise if non array provided', function() {
        var client = eventstore.tcp(tcpConfig);

        var events = {
            something: 'here'
        };

        var testStream = 'TestStream-' + uuid.v4();
        return client.writeEvents(testStream, events).then(function() {
            assert.fail('should not have succeeded')
        }).catch(function(err) {
            assert(err, 'error expected');
        })
    });
});